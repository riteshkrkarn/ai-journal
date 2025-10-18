import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ChatBot from "./pages/ChatBot";
import TeamSpace from "./pages/TeamSpace";
import CreateJoinTeam from "./pages/CreateJoinTeam";
import { hasAuth } from "./utils/auth";
import About from './pages/About'


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = hasAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ChatBot />
    </div>
  );
}

const handleTeamBack = () => {
  console.log("Going back from team space");
  window.location.href = "/dashboard";
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page Route (usually the root path) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes - AuthPage handles both login and signup */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {/* Using DashboardPage as a wrapper for ChatBot or main content */}
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teamspace"
          element={
            <ProtectedRoute>
              <TeamSpace onBack={handleTeamBack} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-join-team"
          element={
            <ProtectedRoute>
              <CreateJoinTeam />
            </ProtectedRoute>
          }
        />
      <Route 
          path="/about" 
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }/>
      </Routes>
    </BrowserRouter>
  );
}
