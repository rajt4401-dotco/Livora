import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MdFlightTakeoff, MdAdd, MdClose, MdCheckCircle, MdCancel, MdPendingActions, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';

const StatusBadge = ({ s }) => {
  if (s === 'Approved') return <span className="badge badge-approved"><MdCheckCircle /> Approved</span>;
  if (s === 'Rejected') return <span className="badge badge-rejected"><MdCancel /> Rejected</span>;
  return <span className="badge badge-pending"><MdPendingActions /> Pending</span>;
};

const EMPTY_FORM = { fromDate: '', toDate: '', reason: '' };

export default function Leave() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All');

  const isAdmin = user?.role === 'admin' || user?.role === 'warden';
  
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leave');
      setLeaves(res.data.data || res.data.leaves || []);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filtered = leaves.filter(l => filter === 'All' || l.status === filter);

  const applyLeave = async () => {
    if (!form.fromDate || !form.toDate || !form.reason.trim()) { toast.error('Please fill all fields'); return; }
    if (new Date(form.fromDate) > new Date(form.toDate)) { toast.error('End date must be after start date'); return; }
    try {
      setSubmitting(true);
      const res = await api.post('/leave', form);
      if (res.data.success) {
        toast.success('Leave application submitted successfully!');
        setForm(EMPTY_FORM);
        setModal(false);
        fetchLeaves();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/leave/${id}/action`, { action });
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}!`);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/leave/${id}`);
      toast.success('Leave deleted successfully!');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete leave');
    }
  };

  const calcDays = (from, to) => {
    const diff = new Date(to) - new Date(from);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const pending = leaves.filter(l => l.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Leave Management' : 'My Leave'}</h1>
          <p className="page-subtitle">{isAdmin ? `${pending} pending approvals` : 'Apply and track your leave requests'}</p>
        </div>
        {!isAdmin && (
          <button id="apply-leave-btn" className="btn btn-primary" onClick={() => setModal(true)}><MdAdd /> Apply Leave</button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card orange">
          <div className="stat-icon"><MdPendingActions /></div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdCheckCircle /></div>
          <div className="stat-value">{approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><MdCancel /></div>
          <div className="stat-value">{rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon"><MdFlightTakeoff /></div>
          <div className="stat-value">{leaves.length}</div>
          <div className="stat-label">Total Requests</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {/* Leave cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div className="empty-state"><p>Loading leaves...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✈️</div><p>No leave requests found</p></div>
        ) : (
          filtered.map(l => (
            <div key={l._id} className="card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div className="avatar">{(l.student?.name || 'Unknown').split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.student?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room {l.student?.room?.number ? `#${l.student.room.number}` : 'N/A'} • Applied {new Date(l.createdAt).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge s={l.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>FROM</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{new Date(l.fromDate).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ color: 'var(--text-muted)', alignSelf: 'flex-end', paddingBottom: 2 }}>→</div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>TO</div>
                      <strong style={{ color: 'var(--text-primary)' }}>{new Date(l.toDate).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>DURATION</div>
                      <strong style={{ color: 'var(--accent-light)' }}>{calcDays(l.fromDate, l.toDate)} day(s)</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                    💬 {l.reason}
                  </div>
                  {l.approvedBy && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      ✅ Processed by: <strong>{l.approvedBy?.name}</strong>
                    </div>
                  )}
                </div>
                {l.status === 'Pending' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    {isAdmin && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(l._id, 'approve')}><MdCheckCircle /> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(l._id, 'reject')}><MdCancel /> Reject</button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(l._id)}
                      className="btn btn-sm" 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      <MdDelete size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Apply Leave Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">✈️ Apply for Leave</div>
              <button className="modal-close" onClick={() => setModal(false)}><MdClose /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>From Date *</label>
                <input type="date" className="input" value={form.fromDate} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>To Date *</label>
                <input type="date" className="input" value={form.toDate} min={form.fromDate || new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Reason *</label>
              <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for leave..." />
            </div>
            {form.fromDate && form.toDate && new Date(form.fromDate) <= new Date(form.toDate) && (
              <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem', color: 'var(--accent-2)' }}>
                📅 Duration: <strong>{calcDays(form.fromDate, form.toDate)} day(s)</strong>
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 4 }}>
              ⏱️ Leave requests are processed by the warden within 24 hours
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={applyLeave} disabled={submitting}>
                {submitting && <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
