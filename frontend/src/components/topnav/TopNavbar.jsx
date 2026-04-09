import { useState } from 'react';
import { MdMenu, MdNotifications, MdSearch } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './TopNav.css';

export default function TopNavbar({ onMenuToggle }) {
  const { user } = useAuth();
  const [notif, setNotif] = useState(true);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="topnav-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <MdMenu size={22} />
        </button>
        <div className="topnav-welcome">
          <span className="topnav-greet">{greet()},&nbsp;</span>
          <span className="topnav-name">{user?.name?.split(' ')[0]}</span>
          <span className="topnav-wave"> 👋</span>
        </div>
      </div>

      <div className="topnav-right">
        <div className="topnav-search">
          <MdSearch size={18} />
          <input placeholder="Search..." className="topnav-search-input" />
        </div>
        <button className="topnav-icon-btn" onClick={() => setNotif(false)} aria-label="Notifications">
          <MdNotifications size={20} />
          {notif && <span className="notif-dot" />}
        </button>
      </div>
    </header>
  );
}
