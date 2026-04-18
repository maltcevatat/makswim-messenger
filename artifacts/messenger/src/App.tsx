import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { isAuthed, getProfile } from "@/auth";
import Login from "@/pages/Login";
import ProfileSetup from "@/pages/ProfileSetup";
import ChatsList from "@/pages/ChatsList";
import ChatView from "@/pages/ChatView";
import Profile from "@/pages/Profile";
import Calendar from "@/pages/Calendar";
import Members from "@/pages/Members";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthed()) {
      navigate("/login");
    } else if (!getProfile()?.name) {
      navigate("/setup");
    }
  }, [navigate]);
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/setup" component={ProfileSetup} />
      <Route path="/">
        <AuthGuard><ChatsList /></AuthGuard>
      </Route>
      <Route path="/chat/:id">
        {(params) => <AuthGuard><ChatView id={params.id} /></AuthGuard>}
      </Route>
      <Route path="/profile">
        <AuthGuard><Profile /></AuthGuard>
      </Route>
      <Route path="/calendar">
        <AuthGuard><Calendar /></AuthGuard>
      </Route>
      <Route path="/members">
        <AuthGuard><Members /></AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard><Admin /></AuthGuard>
      </Route>
      <Route>
        <AuthGuard><ChatsList /></AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
