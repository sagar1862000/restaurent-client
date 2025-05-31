import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import socket from "./utils/sockets.ts";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
