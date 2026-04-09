import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MdBedroomParent, MdAttachMoney, MdReport, MdFlightTakeoff, MdCheckCircle, MdPendingActions } from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../utils/api';

const COLORS_DARK = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{payload[0].name}: <strong>{payload[0].value}</strong></div>;
  return null;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    fees: [], complaints: [], leaves: [], allComplaintsStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [fRes, cRes, lRes, sRes] = await Promise.all([
          api.get('/fees'),
          api.get('/complaints'),
          api.get('/leave'),
          api.get('/complaints/stats') // if student has access
        ]);

        setData({
          fees: fRes.data.data || fRes.data.fees || [],
          complaints: cRes.data.data || cRes.data.complaints || [],
          leaves: lRes.data.data || lRes.data.leaves || [],
          allComplaintsStats: sRes.data.stats || {}
        });
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) return <div className="fade-in" style={{ padding: '2rem' }}>Loading dashboard...</div>;

  const myFee = data.fees[0] || { amount: 0, status: 'Not Assigned', semester: '-', dueDate: '-' };
  const myComplaints = data.complaints;
  const myLeave = data.leaves;

  const cats = data.allComplaintsStats.byCategory || {};
  const complaintsByCategory = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon"><MdBedroomParent /></div>
          <div className="stat-value">{user?.room?.number || 'N/A'}</div>
          <div className="stat-label">My Room — Block {user?.room?.block || '-'}</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{myFee.amount?.toLocaleString() || 0}</div>
          <div className="stat-label">Fee — <span style={{ color: myFee.status === 'Paid' ? 'var(--accent-3)' : 'var(--accent-danger)' }}>{myFee.status}</span></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdReport /></div>
          <div className="stat-value">{myComplaints.length}</div>
          <div className="stat-label">Complaints Raised</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><MdFlightTakeoff /></div>
          <div className="stat-value">{myLeave.length}</div>
          <div className="stat-label">Leave Requests</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Room card */}
        <div className="card">
          <div className="section-title"><MdBedroomParent /> Room Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Room Number', user?.room?.number || 'Not Assigned'], 
              ['Block', user?.room?.block || '-'], 
              ['Floor', user?.room?.floor ? `Floor ${user.room.floor}` : '-'], 
              ['Type', user?.room?.type || '-'], 
              ['Amenities', user?.room?.amenities?.join(', ') || '-']
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee details */}
        <div className="card">
          <div className="section-title"><MdAttachMoney /> Fee Details</div>
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: myFee.status === 'Paid' ? 'var(--accent-3)' : 'var(--accent-danger)', fontFamily: 'Plus Jakarta Sans' }}>
              ₹{myFee.amount?.toLocaleString() || 0}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge badge-${myFee.status?.toLowerCase() || 'pending'}`}>{myFee.status === 'Paid' ? <MdCheckCircle /> : <MdPendingActions />}&nbsp;{myFee.status}</span>
            </div>
          </div>
          {[['Semester', myFee.semester], ['Due Date', myFee.dueDate ? new Date(myFee.dueDate).toLocaleDateString() : '-'], ['Paid On', myFee.paidDate ? new Date(myFee.paidDate).toLocaleDateString() : 'Not paid']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 10 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent complaints */}
        <div className="card">
          <div className="section-title"><MdReport /> My Complaints</div>
          {myComplaints.length === 0 ? (
            <div className="empty-state"><p>No complaints raised yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myComplaints.map(c => (
                <div key={c._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${c.status === 'Resolved' ? 'success' : c.status === 'In Progress' ? 'progress' : 'pending'}`}>{c.status}</span>
                    <span className={`badge badge-${c.priority?.toLowerCase() || 'low'}`}>{c.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint chart */}
        <div className="card">
          <div className="section-title">Hostel Complaint Categories</div>
          {complaintsByCategory.length === 0 ? (
            <div className="empty-state" style={{ height: 160 }}><p>No data</p></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={complaintsByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {complaintsByCategory.map((_, i) => <Cell key={i} fill={COLORS_DARK[i % COLORS_DARK.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {complaintsByCategory.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS_DARK[i % COLORS_DARK.length], display: 'inline-block' }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
