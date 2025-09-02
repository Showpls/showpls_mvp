import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import TelegramWebApp from "./pages/TelegramWebApp";
import CreateOrder from "./pages/CreateOrder";
import Chat from "./pages/Chat";
import DaoWhitepaper from "./pages/DaoWhitepaper";
import MapPage from "./pages/MapPage";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Profile from "./pages/Profile";
import ModernLanding from "./pages/NewLanding";
import FeaturesLanding from "./pages/FeaturesLanding";
import { ThemeProvider } from "next-themes";
import { Suspense } from 'react';

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" component={ModernLanding} />
        <Route path="/twa">
          <TelegramWebApp />
        </Route>
        <Route path="/create-order">
          <CreateOrder />
        </Route>
        <Route path="/map" component={MapPage} />
        <Route path="/profile/:id" component={Profile} />
        <Route path="/chat/:orderId">
          <Chat />
        </Route>
        <Route path="/dao/whitepaper" component={DaoWhitepaper} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
