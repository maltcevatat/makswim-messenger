import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChatsList from "@/pages/ChatsList";
import ChatView from "@/pages/ChatView";
import Profile from "@/pages/Profile";
import Calendar from "@/pages/Calendar";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatsList} />
      <Route path="/chat/:id" component={ChatView} />
      <Route path="/profile" component={Profile} />
      <Route path="/calendar" component={Calendar} />
      <Route>
        <ChatsList />
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
