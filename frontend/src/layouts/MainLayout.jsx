import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import TopNavbar from '../components/topnav/TopNavbar';
import FloatingChatbot from '../components/chatbot/FloatingChatbot';
import { Toaster } from 'react-hot-toast';
import './MainLayout.css';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="layout-main">
        <TopNavbar onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
      <FloatingChatbot />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#141c2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#10b981', secondary: '#141c2e' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#141c2e' } },
        }}
      />
    </div>
  );
}
