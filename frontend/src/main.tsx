import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "./components/ui/sonner";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import "@fontsource/volkhov/400.css";
import "@fontsource/volkhov/700.css";
import "./styles/lovable.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  </StrictMode>
);
