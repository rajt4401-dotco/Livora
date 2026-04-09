import { useState, useEffect } from 'react';
import { MdPeople, MdBedroomParent, MdReport, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import api from '../../utils/api';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>}
      {payload.map(p => <div key={p.name}>{p.name}: <strong style={{ color: p.color || p.fill }}>{p.value}</strong></div>)}
    </div>
  );
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: {}, rooms: {}, complaints: {}, fees: { paid: 0, unpaid: 0, totalAmount: 0 }, recentStudents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [uRes, cRes, fRes, sRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/complaints/stats'),
          api.get('/fees'),
          api.get('/users?role=student&limit=5')
        ]);

        const feesList = fRes.data.data || fRes.data.fees || [];
        const paid = feesList.filter(f => f.status === 'Paid');
        const unpaid = feesList.filter(f => f.status === 'Unpaid');
        const amount = paid.reduce((s, f) => s + f.amount, 0);

        setStats({
          users: uRes.data.stats?.users || {},
          rooms: uRes.data.stats?.rooms || {},
          complaints: cRes.data.stats || {},
          fees: { paid: paid.length, unpaid: unpaid.length, totalAmount: amount },
          recentStudents: sRes.data.users || []
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="fade-in" style={{ padding: '2rem' }}>Loading dashboard...</div>;

  const roomData = [
    { name: 'Occupied', value: stats.rooms.occupied || 0 },
    { name: 'Available', value: stats.rooms.available || 0 },
    { name: 'Maintenance', value: stats.rooms.maintenance || 0 }
  ];
  const feeData = [
    { name: 'Paid', value: stats.fees.paid || 0 },
    { name: 'Unpaid', value: stats.fees.unpaid || 0 }
  ];

  const catMap = stats.complaints.byCategory || {};
  const complaintCats = Object.keys(catMap).map(k => ({ category: k, count: catMap[k] }));

  const trendData = [
    { month: 'Apr', complaints: 8, fees: 6 },
    { month: 'May', complaints: 12, fees: 7 },
    { month: 'Jun', complaints: 7, fees: 8 },
    { month: 'Jul', complaints: 10, fees: 8 },
    { month: 'Aug', complaints: stats.complaints.total || 0, fees: stats.fees.paid || 0 },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Full hostel overview — Livora Management System</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon"><MdPeople /></div>
          <div className="stat-value">{stats.users.students || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon"><MdBedroomParent /></div>
          <div className="stat-value">{stats.rooms.occupied || 0}/{stats.rooms.total || 0}</div>
          <div className="stat-label">Rooms Occupied</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><MdReport /></div>
          <div className="stat-value">{stats.complaints.byStatus?.Pending || 0}</div>
          <div className="stat-label">Pending Complaints</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>₹{((stats.fees.totalAmount || 0) / 1000).toFixed(0)}K</div>
          <div className="stat-label">Fees Collected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Fee pie */}
        <div className="card">
          <div className="section-title"><MdAttachMoney /> Fee Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={feeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                <Cell fill="#10b981" /><Cell fill="#ef4444" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Room pie */}
        <div className="card">
          <div className="section-title"><MdBedroomParent /> Room Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roomData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {roomData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Trend Area Chart */}
        <div className="card">
          <div className="section-title"><MdTrendingUp /> Monthly Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="cgr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                <linearGradient id="fgr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="complaints" stroke="#7c3aed" strokeWidth={2} fill="url(#cgr)" name="Complaints" />
              <Area type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} fill="url(#fgr)" name="Fees Paid" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint bar */}
        <div className="card">
          <div className="section-title"><MdReport /> By Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complaintCats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                {complaintCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent students */}
      <div className="card">
        <div className="section-title"><MdPeople /> Recent Students</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Room</th><th>Course</th><th>Status</th></tr></thead>
            <tbody>
              {stats.recentStudents.map(s => (
                <tr key={s._id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar">{s.avatar}</div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</span></div></td>
                  <td>{s.room?.number ? `#${s.room.number}` : '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.course || '-'}</td>
                  <td><span className={`badge badge-${s.isActive ? 'active' : 'inactive'}`} style={{background: '#10b98122', color: '#10b981'}}>{s.isActive ? 'Active' : 'Deactivated'}</span></td>
                </tr>
              ))}
              {stats.recentStudents.length === 0 && <tr><td colSpan="4">No recent students</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
