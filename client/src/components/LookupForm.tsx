/**
 * @file LookupForm.tsx
 * @fileoverview Lookup form with type selector (DNS, Traceroute, WHOIS, ASN, PTR).
 *
 * @author Ozan Malcı
 */
import { useState, type SyntheticEvent } from "react";
import "./LookupForm.css";
import type { LookupType } from "../types";

const LOOKUP_TYPES: { value: LookupType; label: string }[] = [
    { value: "dns", label: "DNS" },
    { value: "traceroute", label: "Traceroute" },
    { value: "whois", label: "WHOIS" },
    { value: "asn", label: "ASN" },
    { value: "ptr", label: "PTR" },
];

interface LookupFormProps {
    type: LookupType;
    onTypeChange: (type: LookupType) => void;
    onSubmit: (value: string) => void;
    isLoading: boolean;
}

/**
 * Renders a form with a type selector button group above an input field.
 *
 * @param type The currently selected lookup type.
 * @param onTypeChange Called when the user switches lookup types.
 * @param onSubmit Called when the user submits a value.
 * @param isLoading Disables the form while a lookup is in progress.
 * @returns React component.
 */
export function LookupForm({
    type,
    onTypeChange,
    onSubmit,
    isLoading,
}: LookupFormProps) {
    const [value, setValue] = useState("");

    function handleSubmit(evt: SyntheticEvent<HTMLFormElement>) {
        evt.preventDefault();
        const trimmed = value.trim();
        if (trimmed) {
            onSubmit(trimmed);
        }
    }

    const isDomain =
        type === "dns" || type === "traceroute" || type === "whois";
    const placeholder = isDomain ? "example.com" : "1.1.1.1";

    return (
        <form className="lookup-form" onSubmit={handleSubmit}>
            <div className="lookup-form__types">
                {LOOKUP_TYPES.map((lt) => (
                    <button
                        key={lt.value}
                        type="button"
                        className={`lookup-form__type${type === lt.value ? " lookup-form__type--active" : ""}`}
                        onClick={() => {
                            onTypeChange(lt.value);
                        }}
                    >
                        {lt.label}
                    </button>
                ))}
            </div>
            <div className="lookup-form__row">
                <input
                    className="lookup-form__input"
                    type="text"
                    value={value}
                    onChange={(evt) => {
                        setValue(evt.target.value);
                    }}
                    placeholder={placeholder}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck={false}
                />
                <button
                    className="lookup-form__button"
                    type="submit"
                    disabled={isLoading || !value.trim()}
                >
                    Lookup
                </button>
            </div>
        </form>
    );
}
