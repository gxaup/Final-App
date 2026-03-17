import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import SessionDashboard from "@/pages/SessionDashboard";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <RequireAuth>
          <Landing />
        </RequireAuth>
      </Route>
      <Route path="/start">
        <RequireAuth>
          <Home />
        </RequireAuth>
      </Route>
      <Route path="/session/:id">
        <RequireAuth>
          <SessionDashboard />
        </RequireAuth>
      </Route>
      <Route path="/reports">
        <RequireAuth>
          <Reports />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
