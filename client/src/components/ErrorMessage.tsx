/**
 * @file ErrorMessage.tsx
 * @fileoverview Functionality for displaying error messages when a DNS lookup fails.
 *
 * @author Ozan Malcı
 */

import "./ErrorMessage.css";

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

/**
 * Displays an error message when a DNS lookup fails.
 *
 * @param message Error message to display.
 * @param onRetry Optional callback shown as a "Retry" button.
 * @returns React component.
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="error-message" role="alert">
            <span className="error-message__text">{message}</span>
            {onRetry && (
                <button
                    type="button"
                    className="error-message__retry"
                    onClick={onRetry}
                >
                    Retry
                </button>
            )}
        </div>
    );
}
