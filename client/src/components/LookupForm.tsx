/**
 * @file LookupForm.tsx
 * @fileoverview Provides domain input form with a text field and submit button.
 *
 * @author Ozan Malcı
 */
import { useState, type SyntheticEvent } from "react";
import "./LookupForm.css";

const DEFAULT_PLACEHOLDER_URL = "example.com";

interface LookupFormProps {
    /** Called when the user submits a valid domain. */
    onSubmit: (domain: string) => void;
    /** Disables the form while a lookup is in progress. */
    isLoading: boolean;
}

/**
 * Renders a form for domain lookups.
 *
 * @param onSubmit Callback fired when the user submits a valid domain.
 * @param isLoading Disables the form while a lookup is in progress.
 * @returns React component.
 */
export function LookupForm({ onSubmit, isLoading }: LookupFormProps) {
    const [domain, setDomain] = useState("");

    function handleSubmit(evt: SyntheticEvent<HTMLFormElement>) {
        evt.preventDefault();
        const trimmed = domain.trim();
        if (trimmed) {
            onSubmit(trimmed);
        }
    }

    return (
        <>
            <form className="lookup-form" onSubmit={handleSubmit}>
                <input
                    id="domain-input"
                    className="lookup-form__input"
                    type="text"
                    value={domain}
                    onChange={(evt) => {
                        setDomain(evt.target.value);
                    }}
                    placeholder={DEFAULT_PLACEHOLDER_URL}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                />
                <button
                    id="lookup-button"
                    className="lookup-form__button"
                    type="submit"
                    disabled={isLoading || !domain.trim()}
                >
                    Lookup
                </button>
            </form>
        </>
    );
}
