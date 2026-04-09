import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdDashboard, MdBedroomParent, MdAttachMoney, MdReport, MdFlightTakeoff, MdLogout, MdSmartToy, MdPeople } from 'react-icons/md';
import './Sidebar.css';
import logo from '../../assets/logo.png';

const NAV = {
  student: [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/fees', label: 'My Fees', icon: <MdAttachMoney /> },
    { path: '/complaints', label: 'Complaints', icon: <MdReport /> },
    { path: '/leave', label: 'Leave', icon: <MdFlightTakeoff /> },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/rooms', label: 'Rooms', icon: <MdBedroomParent /> },
    { path: '/fees', label: 'Fees', icon: <MdAttachMoney /> },
    { path: '/complaints', label: 'Complaints', icon: <MdReport /> },
    { path: '/leave', label: 'Leave Requests', icon: <MdFlightTakeoff /> },
    { path: '/students', label: 'Students', icon: <MdPeople /> },
  ],
  warden: [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/rooms', label: 'Rooms', icon: <MdBedroomParent /> },
    { path: '/complaints', label: 'Complaints', icon: <MdReport /> },
    { path: '/leave', label: 'Leave Approvals', icon: <MdFlightTakeoff /> },
  ],
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = { student: '#7c3aed', admin: '#06b6d4', warden: '#10b981' };
  const roleColor = roleColors[user?.role] || '#7c3aed';

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={logo} alt="logo img" className="logo" />
        </div>

        {/* User card */}
        <div className="sidebar-user" style={{ borderColor: `${roleColor}33` }}>
          <div className="avatar avatar-lg" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}>
            {user?.avatar}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role" style={{ color: roleColor }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* AI Bot callout */}
        <div className="sidebar-ai">
          <MdSmartToy size={18} />
          <span>AI Features Active</span>
        </div>

        {/* Logout */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <MdLogout size={18} />
          Sign Out
        </button>
      </aside>
    </>
  );
}
