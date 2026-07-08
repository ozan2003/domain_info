// This is because i got eslint is giving me warnings.
declare module "nodejs-traceroute" {
    import { EventEmitter } from "node:events";

    class Traceroute extends EventEmitter {
        trace(domainName: string): void;
    }

    export default Traceroute;
}
