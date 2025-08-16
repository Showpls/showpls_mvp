import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { Theme } from "@radix-ui/themes";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { tonConnectUI } from "./lib/ton-connect-react";

createRoot(document.getElementById("root")!).render(
  <TonConnectUIProvider connector={tonConnectUI}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Theme>
        <App />
      </Theme>
    </ThemeProvider>
  </TonConnectUIProvider>
);
