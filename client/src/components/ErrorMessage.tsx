/**
 * @file ErrorMessage.tsx
 * @fileoverview Functionality for displaying error messages when a DNS lookup fails.
 *
 * @author Ozan Malcı
 */

interface ErrorMessageProps {
    message: string;
}

/**
 * Displays an error message when a DNS lookup fails.
 *
 * @param message Error message to display.
 * @returns React component.
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <div className="error-message" role="alert">
            {message}
        </div>
    );
}
