import { useState, useEffect } from 'react';
import { MdAttachMoney, MdCheckCircle, MdPendingActions, MdSearch } from 'react-icons/md';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{payload[0].name}: <strong>{payload[0].value}</strong></div>;
  return null;
};

export default function Fees() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees');
      setFees(res.data.data || res.data.fees || []);
    } catch (err) {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const toggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.put(`/fees/${id}/status`, { status: newStatus });
      toast.success(`Fee marked as ${newStatus}`);
      fetchFees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filtered = fees.filter(f =>
    (filter === 'All' || f.status === filter) &&
    (
      (f.student?.name && f.student.name.toLowerCase().includes(search.toLowerCase())) ||
      (f.room?.number && f.room.number.toString().includes(search))
    )
  );

  const paid = fees.filter(f => f.status === 'Paid');
  const unpaid = fees.filter(f => f.status === 'Unpaid');
  const totalCollected = paid.reduce((s, f) => s + f.amount, 0);
  const totalPending = unpaid.reduce((s, f) => s + f.amount, 0);
  const pieData = [{ name: 'Paid', value: paid.length }, { name: 'Unpaid', value: unpaid.length }];

  const colSpanCount = user?.role === 'student' ? 7 : 8;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Track and manage hostel fee payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-icon"><MdCheckCircle /></div>
          <div className="stat-value">{paid.length}</div>
          <div className="stat-label">Fees Paid</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><MdPendingActions /></div>
          <div className="stat-value">{unpaid.length}</div>
          <div className="stat-label">Fees Pending</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalCollected.toLocaleString()}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalPending.toLocaleString()}</div>
          <div className="stat-label">Pending Amount</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {['All', 'Paid', 'Unpaid'].map(s => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 34, width: 200, fontSize: '0.8rem' }} placeholder="Search student or room..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Amount</th>
                    <th>Semester</th>
                    <th>Due Date</th>
                    <th>Paid On</th>
                    <th>Status</th>
                    {user?.role !== 'student' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={colSpanCount} style={{ textAlign: 'center', padding: '2rem' }}>Loading fees...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={colSpanCount} style={{ textAlign: 'center', padding: '2rem' }}>No fee records found</td></tr>
                  ) : (
                    filtered.map(f => (
                      <tr key={f._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ background: f.status === 'Paid' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                              {f.student?.avatar || '-'}
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.student?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>{f.room?.number ? `#${f.room.number}` : '-'}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{f.amount?.toLocaleString()}</td>
                        <td style={{ fontSize: '0.8rem' }}>{f.semester}</td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(f.dueDate).toLocaleDateString()}</td>
                        <td style={{ fontSize: '0.8rem', color: f.paidDate ? 'var(--accent-3)' : 'var(--text-muted)' }}>{f.paidDate ? new Date(f.paidDate).toLocaleDateString() : '—'}</td>
                        <td><span className={`badge badge-${f.status.toLowerCase()}`}>{f.status}</span></td>
                        {user?.role !== 'student' && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className={`btn btn-sm ${f.status === 'Paid' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => toggle(f._id, f.status)}
                              >
                                {f.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                              </button>
                              {f.status === 'Unpaid' && (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={async () => {
                                    const res = await (await import('../utils/ai')).predictFeeDelinquency({
                                      unpaid_semesters: 1, // Simplified for now
                                      late_payments: 0,
                                      year: 2024,
                                      course_type: 0,
                                      part_time_job: 0,
                                      scholarship: 0
                                    });
                                    toast(`🤖 AI Risk: ${res.riskLevel} (${Math.round(res.probability * 100)}%)`, { icon: '🤖' });
                                  }}
                                  title="Analyze default risk using AI"
                                >
                                  AI Risk
                                </button>
                              )}
                            </div>
                          </td>
                        )}

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pie chart sidebar */}
        <div className="card">
          <div className="section-title">Payment Status</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                <Cell fill="#10b981" /><Cell fill="#ef4444" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span><span className="dot dot-green" style={{ marginRight: 6 }} />Paid</span>
              <strong style={{ color: 'var(--accent-3)' }}>{paid.length} students</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span><span className="dot dot-red" style={{ marginRight: 6 }} />Unpaid</span>
              <strong style={{ color: 'var(--accent-danger)' }}>{unpaid.length} students</strong>
            </div>
          </div>
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Collection Rate</div>
            <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${fees.length > 0 ? (paid.length / fees.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-3), #34d399)', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-3)', marginTop: 6 }}>{fees.length > 0 ? Math.round((paid.length / fees.length) * 100) : 0}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
