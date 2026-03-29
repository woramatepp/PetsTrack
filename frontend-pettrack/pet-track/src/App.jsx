// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview';
import MyPets from './pages/MyPets'; // Import the new pages
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        
        {/* We make Overview the default. Later you can protect this. */}
        <Route path="/" element={<Overview />} />
        
        <Route path="/mypets" element={<MyPets />} />
        
        {/* Placeholders for other tabs */}
        <Route path="/tracking" element={<Overview activeTab="tracking" />} />
        <Route path="/notifications" element={<Overview activeTab="notifications" />} />
        
        {/* Default catch-all redirect to homepage */}
        <Route path="*" element={<Overview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;