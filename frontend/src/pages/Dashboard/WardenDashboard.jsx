import { useState, useEffect } from 'react';
import { MdFlightTakeoff, MdReport, MdCheckCircle, MdCancel, MdPendingActions, MdBedroomParent } from 'react-icons/md';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#7c3aed'];
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{payload[0].name}: <strong>{payload[0].value}</strong></div>;
  return null;
};

export default function WardenDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, cRes] = await Promise.all([
        api.get('/leave'),
        api.get('/complaints')
      ]);
      setLeaves(lRes.data.data || lRes.data.leaves || []);
      setComplaints(cRes.data.data || cRes.data.complaints || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pending = leaves.filter(l => l.status === 'Pending');
  const approved = leaves.filter(l => l.status === 'Approved');
  const rejected = leaves.filter(l => l.status === 'Rejected');
  const pendingComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress');

  const leaveStats = [
    { name: 'Pending', value: pending.length },
    { name: 'Approved', value: approved.length },
    { name: 'Rejected', value: rejected.length },
  ];

  const complaintStats = [
    { name: 'Pending', value: complaints.filter(c => c.status === 'Pending').length },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length },
    { name: 'Acknowledged', value: complaints.filter(c => c.status === 'Acknowledged').length },
  ];

  const handleLeave = async (id, action) => {
    try {
      await api.put(`/leave/${id}/status`, { status: action === 'approve' ? 'Approved' : 'Rejected' });
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update leave');
    }
  };

  if (loading) return <div className="fade-in" style={{ padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warden Dashboard</h1>
          <p className="page-subtitle">Leave approvals and complaint oversight</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-icon"><MdPendingActions /></div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">Pending Leave Requests</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdCheckCircle /></div>
          <div className="stat-value">{approved.length}</div>
          <div className="stat-label">Leaves Approved</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><MdReport /></div>
          <div className="stat-value">{pendingComplaints.length}</div>
          <div className="stat-label">Open Complaints</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon"><MdBedroomParent /></div>
          <div className="stat-value">12</div>
          <div className="stat-label">Total Rooms Managed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Leave chart */}
        <div className="card">
          <div className="section-title"><MdFlightTakeoff /> Leave Overview</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leaveStats} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                {leaveStats.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint chart */}
        <div className="card">
          <div className="section-title"><MdReport /> Complaint Summary</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={complaintStats} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                {complaintStats.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending leave requests */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title"><MdPendingActions /> Pending Leave Requests ({pending.length})</div>
        {pending.length === 0 ? (
          <div className="empty-state"><p>🎉 All leave requests have been processed!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(l => (
              <div key={l._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{l.student?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room {l.student?.room?.number || 'N/A'} • Applied {new Date(l.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>📅 {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>💬 {l.reason}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleLeave(l._id, 'approve')}><MdCheckCircle /> Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleLeave(l._id, 'reject')}><MdCancel /> Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent complaints */}
      <div className="card">
        <div className="section-title"><MdReport /> Active Complaints</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {pendingComplaints.map(c => (
                <tr key={c._id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.student?.name || 'Unknown'}</td>
                  <td>{c.title}</td>
                  <td>{c.category}</td>
                  <td><span className={`badge badge-${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                  <td><span className={`badge badge-${c.status === 'In Progress' ? 'progress' : 'pending'}`}>{c.status}</span></td>
                </tr>
              ))}
              {pendingComplaints.length === 0 && <tr><td colSpan="5">No active complaints</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
