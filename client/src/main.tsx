/**
 * @file main.tsx
 * @fileoverview Application entry point. Mounts the React root.
 *
 * @author Ozan Malcı
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Option } from "oxide.ts";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { ROOT_ELEMENT_NOT_FOUND_ERROR_MSG } from "./constants";
import "./index.css";

const rootElement = Option.from(document.getElementById("root")).expect(
    ROOT_ELEMENT_NOT_FOUND_ERROR_MSG,
);
const root = createRoot(rootElement);

root.render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>,
);
