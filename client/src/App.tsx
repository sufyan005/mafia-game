import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GamePage from "@/pages/game";
import { Component, ReactNode, ErrorInfo } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[hsl(220,26%,8%)] to-[hsl(220,26%,5%)] text-foreground flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl">💥</div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <pre className="bg-red-500/10 border border-red-500/30 rounded p-3 text-left text-sm overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              className="px-4 py-2 bg-primary/20 border border-primary/30 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GamePage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
