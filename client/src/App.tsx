import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <nav style={{ marginBottom: 12 }}>
          <Link to="/">Home</Link> | <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
