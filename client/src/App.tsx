import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import NewLanding from "./pages/NewLanding";
import TelegramWebApp from "./pages/TelegramWebApp";
import CreateOrder from "./pages/CreateOrder";
import Chat from "./pages/Chat";
import DaoWhitepaper from "./pages/DaoWhitepaper";
import MapPage from "./pages/MapPage";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Profile from "./pages/Profile";
import ModernLanding from "./pages/NewLanding";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ModernLanding} />
      <Route path="/twa" component={TelegramWebApp} />
      <Route path="/create-order" component={CreateOrder} />
      <Route path="/map" component={MapPage} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/chat/:orderId">
        <ErrorBoundary>
          <Chat />
        </ErrorBoundary>
      </Route>
      <Route path="/dao/whitepaper" component={DaoWhitepaper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <div>
          <Router />
        </div>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
