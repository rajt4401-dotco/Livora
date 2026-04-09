import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdEmail, MdLock, MdSchool, MdAdminPanelSettings, MdSecurity } from 'react-icons/md';
import './Login.css';
import logo from '../assets/logo.png';

const ROLES = [
  { id: 'student', label: 'Student', icon: <MdSchool />, desc: 'View room, fees & complaints', color: '#7c3aed' },
  { id: 'admin', label: 'Admin', icon: <MdAdminPanelSettings />, desc: 'Full hostel management', color: '#06b6d4' },
  { id: 'warden', label: 'Warden', icon: <MdSecurity />, desc: 'Leave & complaint approvals', color: '#10b981' },
];

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Auto-fill emails for demo purposes
  const DEMO_EMAILS = {
    student: 'rahul@livora.edu',
    admin: 'admin@livora.edu',
    warden: 'warden@livora.edu'
  };

  const handleRoleSelect = (rId) => {
    setRole(rId);
    setEmail(DEMO_EMAILS[rId]);
    setPassword('hostel@123');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const selected = ROLES.find(r => r.id === role);

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-brand">
            <img src={logo} alt="logo img" className="logo" />
          </div>
          <h2 className="login-headline">
            Your hostel,<br />
            <span className="gradient-text">intelligently</span> managed.
          </h2>
          <p className="login-desc">
            One platform for students, wardens, and admins to manage rooms, fees, complaints, and more — powered by AI insights.
          </p>
          <div className="login-features">
            {['🤖 AI Complaint Classification', '📊 Real-time Analytics', '💬 Smart Chatbot', '🔔 Instant Notifications'].map(f => (
              <div key={f} className="login-feature-item">{f}</div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="login-card">
            <h2 className="login-title">Welcome back!</h2>
            <p className="login-subtitle">Select your role and sign in to continue</p>

            {/* Role selector */}
            <div className="role-grid">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`role-card ${role === r.id ? 'role-card-active' : ''}`}
                  style={role === r.id ? { borderColor: r.color, background: `${r.color}18` } : {}}
                  onClick={() => handleRoleSelect(r.id)}
                >
                  <span className="role-icon" style={{ color: r.color }}>{r.icon}</span>
                  <span className="role-label">{r.label}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>

            {error && <div className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <MdEmail className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="input input-with-icon"
                    placeholder={`${role}@hostel.edu`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-wrap">
                  <MdLock className="input-icon" />
                  <input
                    id="login-password"
                    type="password"
                    className="input input-with-icon"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary login-btn"
                style={loading ? {} : { background: `linear-gradient(135deg, ${selected?.color}, ${selected?.color}bb)` }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />
                ) : null}
                {loading ? 'Signing in...' : `Sign in as ${selected?.label}`}
              </button>
            </form>

            <p className="login-hint">💡 <strong>Demo mode:</strong> Click a role to auto-fill generic seeded credentials!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
