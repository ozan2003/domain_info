/**
 * @file Spinner.tsx
 * @fileoverview Loading spinner shown while DNS records are being fetched.
 *
 * @author Ozan Malcı
 */

import "./Spinner.css";

export function Spinner() {
    return (
        <div className="spinner-container">
            <div className="spinner" />
            <p className="spinner-container__text">Resolving DNS records...</p>
        </div>
    );
}
