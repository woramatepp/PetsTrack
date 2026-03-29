// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Overview from './pages/Overview';
import MyPets from './pages/MyPets';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* หน้าหลัก */}
        <Route path="/" element={<Overview />} />
        <Route path="/mypets" element={<MyPets />} />
        
        {/* Redirect กรณีระบุ Path ผิด */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;