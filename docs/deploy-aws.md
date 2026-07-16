# Deploying to AWS EC2 (free tier)

This is a step-by-step walkthrough for getting `domain_info` online on a
single AWS EC2 t2.micro instance, fronted by a free Cloudflare quick tunnel
(no domain purchase needed). Total time: ~30 minutes.

> **Cost:** stays in the AWS free tier (12 months from account creation)
> as long as you use a `t2.micro` with ≤30 GB EBS and stay under 100 GB
> outbound data/month. Set a billing alarm (step 1) so you can't be
> surprised.

---

## 0. What you'll have at the end

```
https://<random-words>.trycloudflare.com    ← your app
                 │
                 ▼  (encrypted tunnel, no port-forwarding on the EC2)
EC2 t2.micro  ── cloudflared ──► nginx :80
                                ├─ /         -> React static
                                └─ /api/*    -> Node (systemd)
                                              └─ SQLite at /var/lib/domain_info/dev.db
```

Push to `main` on GitHub -> auto-deploys. First deploy is manual.

---

## 1. Create an AWS account (one-time, ~5 min)

1. Go to <https://aws.amazon.com/free/> and click **Create a free account**.
2. Use a personal email. It will ask for a credit/debit card, but you will
   not be charged as long as you stay within the free tier.
3. Choose the **Basic** support plan (free).
4. After the account is live, go to the
   [Billing console -> Billing preferences](https://console.aws.amazon.com/billing/home#/preferences)
   and tick **Receive billing alerts**. Then go to
   [CloudWatch -> Alarms -> Create alarm](https://console.aws.amazon.com/cloudwatch/home#alarmsV2:)
   and set a billing alarm at **$1**. This way, if you ever accidentally
   leave something running that isn't free, you find out before the bill
   does.

---

## 2. Launch the EC2 instance (~10 min)

1. Go to <https://console.aws.amazon.com/ec2/> -> **Launch instance**.
2. Fill in:
   - **Name:** `domain-info`
   - **AMI:** *Ubuntu Server 22.04 LTS* (free tier eligible)
   - **Instance type:** `t2.micro` (free tier eligible)
   - **Key pair:** click *Create new key pair*, name it `domain-info`,
     type RSA, format `.pem`. **Save the `.pem` file somewhere safe.**
   - **Network settings:** click *Edit* ->
     - Allow SSH traffic from **My IP** (not 0.0.0.0/0)
     - ✅ Allow HTTP traffic from the internet
     - ✅ Allow HTTPS traffic from the internet
   - **Storage:** 20 GiB `gp3` (well under the 30 GiB free quota)
3. Click **Launch instance**. Wait for state = *Running*.
4. Select the instance -> **Actions -> Networking -> Allocate Elastic IP** ->
   **Allocate** -> select the instance -> **Associate**. The Elastic IP is
   the address you'll SSH to. (If you skip this, the public IP changes on
   every reboot.)

---

## 3. SSH in and bootstrap the server (~10 min, mostly waiting for apt)

> On **Windows 10/11** PowerShell the same `ssh` command works — no PuTTY
> needed. Just make sure your `.pem` file is somewhere readable.

```powershell
# from PowerShell, in the folder where you saved domain-info.pem
icacls .\domain-info.pem /inheritance:r
icacls .\domain-info.pem /grant:r "$($env:USERNAME):(R)"
ssh -i .\domain-info.pem ubuntu@<your-elastic-ip>
```

You should land in a `~$` prompt.

Now run the bootstrap script. It installs Node 20, nginx, cloudflared, sets
up UFW, and writes systemd units. **You only run this once.**

```bash
# upload the repo to the box first (easiest: clone it)
git clone https://github.com/<you>/<your-repo>.git /tmp/domain_info
cd /tmp/domain_info
sudo bash deploy/setup-server.sh
```

The script will print a checklist of next steps when it finishes. Leave
the SSH session open — you'll use it again.

---

## 4. First deploy (manual)

The setup script created the right directories but didn't clone the code
into `/opt/domain_info`. Do that now:

```bash
# from inside the cloned repo on the EC2
sudo rsync -a --delete --exclude='.git' --exclude='.env' \
  /tmp/domain_info/ /opt/domain_info/
sudo chown -R ubuntu:ubuntu /opt/domain_info

# install + build the server
cd /opt/domain_info/server
npm ci
npx prisma migrate deploy
npm run build

# build the client
cd /opt/domain_info/client
npm ci
npm run build
```

Create the production `.env` (lives outside the repo so deploys don't
clobber it):

```bash
sudo install -m 640 -o ubuntu -g ubuntu /dev/stdin /var/lib/domain_info/.env <<'EOF'
DATABASE_URL=file:/var/lib/domain_info/dev.db
JWT_SECRET=PASTE-A-REAL-64-CHAR-RANDOM-STRING-HERE
NODE_ENV=production
PORT=6633
EOF
```

Generate a real `JWT_SECRET` (≥ 32 chars, must not contain "change-me"):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Edit `/var/lib/domain_info/.env` and paste it in (`sudo nano ...`).

Create the SQLite database file in the persistent location:

```bash
sudo touch /var/lib/domain_info/dev.db
sudo chown ubuntu:ubuntu /var/lib/domain_info/dev.db
```

Now enable + start the service and nginx:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now domain_info
sudo systemctl status domain_info --no-pager   # should be "active (running)"
curl http://127.0.0.1/health                     # {"isOk":true}
```

---

## 5. Start the Cloudflare tunnel (no account required)

```bash
sudo systemctl enable --now cloudflared-quick
sudo journalctl -u cloudflared-quick -f
```

Within a few seconds you'll see a line like:

```
... https://something-random.trycloudflare.com ...
```

That is your public URL. Open it. You should see the app.

> The URL **changes every time the tunnel restarts** (EC2 reboot, etc.).
> For a permanent URL, see [Section 8: Stable URL](#8-stable-url-optional).

---

## 6. Set up GitHub auto-deploy (~5 min)

In the GitHub repo, go to **Settings -> Secrets and variables -> Actions ->
New repository secret**. Add three:

| Secret name  | Value                                              |
| ------------ | -------------------------------------------------- |
| `EC2_HOST`   | The Elastic IP from step 2 (e.g. `54.123.45.67`)   |
| `EC2_USER`   | `ubuntu`                                           |
| `EC2_SSH_KEY` | The full contents of your `.pem` file (multi-line) |

On the EC2, allow the `ubuntu` user to restart the service without a
password:

```bash
echo 'ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart domain_info, /usr/bin/systemctl is-active domain_info' \
  | sudo tee /etc/sudoers.d/domain_info-deploy
sudo chmod 440 /etc/sudoers.d/domain_info-deploy
```

Push to `main`:

```bash
git push origin main
```

Watch the **Actions** tab. On success, your changes are live in ~30 s.

---

## 7. Day-to-day

- **Logs:** `sudo journalctl -u domain_info -f` (server) /
  `sudo journalctl -u cloudflared-quick -f` (tunnel).
- **Restart the backend:** `sudo systemctl restart domain_info`.
- **DB inspection:** `cd /opt/domain_info/server && npx prisma studio` (then
  port-forward if you want a GUI).
- **Stop the instance when idle** to save the free-tier hours:
  `sudo shutdown -h now` from inside, or **Instance state -> Stop** in the
  console. Storage keeps, instance hours pause.

---

## 8. Stable URL (optional)

The quick tunnel's URL is random and changes on tunnel restart. For a
permanent `*.trycloudflare.com` URL you need a free Cloudflare account
and a domain you own (or a free domain from
<https://www.duckdns.org/>). Then:

```bash
# on the EC2, after pointing your domain at Cloudflare nameservers
cloudflared tunnel login                       # opens a browser flow
cloudflared tunnel create domain-info
cloudflared tunnel route dns domain-info yourdomain.example.com
# edit /etc/cloudflared/config.yml per the docs
sudo systemctl disable --now cloudflared-quick
sudo systemctl enable --now cloudflared
```

Skip this for the demo — the quick tunnel is fine for a few months.

---

## 9. After 12 months

The free tier expires on the **anniversary of your account creation**, not
on the anniversary of this instance. Two paths:

- **Move to a different VM** ($4-6/mo: Hetzner, DigitalOcean, Vultr, etc.).
  The `deploy/` scripts work on any Ubuntu 22.04 box.
- **Delete the instance** if you no longer need it: EC2 console ->
  *Terminate instance*. EBS is freed and no longer billed.

---

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `502 Bad Gateway` from the tunnel | `sudo systemctl status domain_info` — check the backend log. Most often: bad `JWT_SECRET` in `.env` (must be ≥ 32 chars and not contain "change-me"). |
| Traceroute times out | EC2 blocks outbound ICMP by default in newer AWS account defaults. **Outbound ICMP from EC2 to the internet is allowed by default** for new accounts; if your account predates 2023, check the security group's outbound rules. |
| `cloudflared` prints a URL that 502s | The tunnel came up before nginx was ready. `sudo systemctl restart cloudflared-quick`. |
| GitHub Action fails on `rsync` | Wrong `EC2_SSH_KEY` (newlines lost) or wrong `EC2_USER`. Re-paste the full `.pem` including the `-----BEGIN/END-----` lines. |
| OOM kills in `journalctl` | argon2 under load on 1 GB RAM. The `ARGON2_OPTS` in `authService.ts` already use the minimum (19 MiB). If you still see OOMs, set `NODE_OPTIONS=--max-old-space-size=512` in the systemd unit. |
