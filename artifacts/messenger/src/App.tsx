import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login        from "@/pages/Login";
import ProfileSetup from "@/pages/ProfileSetup";
import ChatsList    from "@/pages/ChatsList";
import ChatView     from "@/pages/ChatView";
import Profile      from "@/pages/Profile";
import Calendar     from "@/pages/Calendar";
import Members      from "@/pages/Members";
import Admin        from "@/pages/Admin";
import Calls        from "@/pages/Calls";
import Settings     from "@/pages/Settings";

const queryClient = new QueryClient();

function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (adminOnly && user.role !== "admin") { navigate("/"); }
  }, [user, loading, adminOnly, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#10131a" }}>
        <div className="w-8 h-8 border-2 border-[#46eedd]/20 border-t-[#46eedd] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login"  component={Login} />
      <Route path="/setup"  component={ProfileSetup} />
      <Route path="/">
        <AuthGuard><ChatsList /></AuthGuard>
      </Route>
      <Route path="/chat/:id">
        {(p) => <AuthGuard><ChatView id={p.id} /></AuthGuard>}
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
        <AuthGuard adminOnly><Admin /></AuthGuard>
      </Route>
      <Route path="/calls">
        <AuthGuard><Calls /></AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard><Settings /></AuthGuard>
      </Route>
      <Route>
        <AuthGuard><ChatsList /></AuthGuard>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
