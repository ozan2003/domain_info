/**
 * @file RecordSection.tsx
 * @fileoverview Provides reusable collapsible accordion sections for displaying a group of DNS records.
 *
 * @author Ozan Malcı
 */
import { useState, type ReactNode } from "react";

/** Milliseconds to show the "Copied" state before reverting to idle. */
const COPY_BUTTON_TIMEOUT_MS = 1500;

/** Represents the current state of the copy button. */
type CopyButtonState = "idle" | "copied" | "error";

interface RecordSectionProps {
    /** The record type label (e.g. "A", "MX"). */
    label: string;
    /** Number of records in this section. */
    count: number;
    /** Whether the section should start expanded. Ignored if empty. */
    shouldStartExpanded?: boolean;
    /** Text content to copy when copy button is clicked. */
    copiedText?: string;
    /** The record list content. */
    children: ReactNode;
}

/** SVG chevron pointing down. Rotated via CSS when section is expanded. */
function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 6l4 4 4-4" />
        </svg>
    );
}

/** SVG copy icon. */
function CopyIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="5" y="5" width="8" height="8" rx="1.5" />
            <path d="M3.5 11.5v-7A1.5 1.5 0 0 1 5 3h6" />
        </svg>
    );
}

/**
 * Renders a collapsible section for a specific DNS record type.
 *
 * @param param0 - The properties for the record section.
 * @param param0.label - The DNS record type label (e.g. "A", "MX").
 * @param param0.count - The number of records in this section.
 * @param param0.shouldStartExpanded - Whether the section should start expanded. Ignored if empty.
 * @param param0.copiedText - Text content to copy when copy button is clicked.
 * @param param0.children - The record list content.
 * @returns The record section JSX.
 */
export function RecordSection({
    label,
    count,
    shouldStartExpanded = true,
    copiedText,
    children,
}: RecordSectionProps) {
    const isEmpty = count === 0;

    const [isRecordExpanded, setIsRecordExpanded] = useState(
        shouldStartExpanded && !isEmpty,
    );
    const [copyButton, setCopyButton] = useState<CopyButtonState>("idle");

    async function handleCopy() {
        if (!copiedText) {
            return;
        }

        try {
            await navigator.clipboard.writeText(copiedText);
            setCopyButton("copied");
        } catch {
            setCopyButton("error");
        }
        window.setTimeout(() => { setCopyButton("idle"); }, COPY_BUTTON_TIMEOUT_MS);
    }

    return (
        <div className="record-section">
            <div
                className={`record-section__header ${isEmpty ? "record-section__header--empty" : ""}`}
            >
                <div className="record-section__title">
                    <span className="record-section__label">{label}</span>
                    <span className="record-section__count">({count})</span>
                </div>

                <div className="record-section__actions">
                    <button
                        type="button"
                        className="record-section__copy-button"
                        onClick={() => { void handleCopy(); }}
                        disabled={isEmpty || !copiedText}
                        title={
                            copyButton === "copied" ? "Copied" : "Copy records"
                        }
                    >
                        <CopyIcon className="record-section__action-icon" />
                        <span className="record-section__copy-text">
                            {copyButton === "copied" ? "Copied" : "Copy"}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="record-section__toggle-button"
                        onClick={() => { setIsRecordExpanded((prev) => !prev); }}
                        disabled={isEmpty}
                    >
                        <ChevronIcon
                            className={`record-section__chevron${isRecordExpanded ? " record-section__chevron--open" : ""}`}
                        />
                    </button>
                </div>
            </div>

            {isEmpty ? (
                <EmptyRecordSection />
            ) : (
                <ExpandedRecordSection isRecordExpanded={isRecordExpanded}>
                    {children}
                </ExpandedRecordSection>
            )}
        </div>
    );
}

function ExpandedRecordSection({
    isRecordExpanded,
    children,
}: {
    isRecordExpanded: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={`record-section__body${isRecordExpanded ? " record-section__body--open" : ""}`}
        >
            <div className="record-section__body-inner">
                <div className="record-section__content">{children}</div>
            </div>
        </div>
    );
}

function EmptyRecordSection() {
    return <div className="record-section__empty">No records found</div>;
}
