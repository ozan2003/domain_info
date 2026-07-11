/**
 * @file Spinner.tsx
 * @fileoverview Loading spinner shown while DNS records are being fetched.
 *
 * @author Ozan Malcı
 */

import "./Spinner.css";

interface SpinnerProps {
    text?: string;
}

export function Spinner({ text = "Loading..." }: SpinnerProps) {
    return (
        <div className="spinner-container">
            <div className="spinner" />
            <p className="spinner-container__text">{text}</p>
        </div>
    );
}
