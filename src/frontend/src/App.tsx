import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatBot from './pages/ChatBot';
import TeamSpace from './pages/TeamSpace';
const handleTeamBack = () => {
  // Navigate to home or chat page
  console.log('Going back from team space');
};
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ChatBot />} />
        <Route path="/teamspace" element={<TeamSpace onBack={handleTeamBack}/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;