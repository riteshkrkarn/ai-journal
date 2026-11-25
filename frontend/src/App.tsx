import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ChatBot from "./pages/ChatBot";
import TeamSpace from "./pages/TeamSpace";
import CreateJoinTeam from "./pages/CreateJoinTeam";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { hasAuth } from "./utils/auth";
import { ThemeProvider } from "./context/ThemeContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = hasAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

const handleTeamBack = () => {
  window.location.href = "/dashboard";
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<About />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ChatBot />
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
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
