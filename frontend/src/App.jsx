import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Rooms from './pages/Rooms';
import Fees from './pages/Fees';
import Complaints from './pages/Complaints';
import Leave from './pages/Leave';
import Students from './pages/Students';

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>🚫</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Plus Jakarta Sans' }}>404 — Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/students" element={<Students />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
