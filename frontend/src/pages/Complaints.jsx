import { useState, useEffect } from 'react';
import { MdReport, MdAdd, MdClose, MdSmartToy, MdSentimentSatisfied, MdSentimentDissatisfied, MdSentimentNeutral, MdDelete, MdAccessTime } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';
import { analyzeComplaint } from '../utils/ai';

const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Resolved', 'Acknowledged'];
const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SentimentIcon = ({ s }) => {
  if (s === 'positive') return <MdSentimentSatisfied style={{ color: '#10b981' }} />;
  if (s === 'negative') return <MdSentimentDissatisfied style={{ color: '#ef4444' }} />;
  return <MdSentimentNeutral style={{ color: '#f59e0b' }} />;
};

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', description: '' });
  const [aiResult, setAiResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data.data || res.data.complaints || []);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filtered = complaints.filter(c => filter === 'All' || c.status === filter);

  useEffect(() => {
    const text = form.description.trim();
    if (text.length < 10) {
      setAiResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      const result = await analyzeComplaint(text);
      setAiResult(result);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [form.description]);

  const handleDescChange = (val) => {
    setForm(f => ({ ...f, description: val }));
  };


  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Please fill all fields'); return; }
    try {
      setSubmitting(true);
      const res = await api.post('/complaints', form);
      if (res.data.success) {
        toast.success('Complaint submitted! 🤖 AI classified it automatically.');
        setForm({ title: '', description: '' });
        setAiResult(null);
        setModal(false);
        fetchComplaints();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete complaint');
    }
  };

  const complaintCats = [...new Set(complaints.map(c => c.category))].map(cat => ({
    name: cat, count: complaints.filter(c => c.category === cat).length
  }));

  const sentimentPos = complaints.filter(c => c.sentiment === 'positive').length;
  const sentimentNeg = complaints.filter(c => c.sentiment === 'negative').length;
  const sentimentNeu = complaints.filter(c => c.sentiment === 'neutral').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">{complaints.length} total · {complaints.filter(c => c.status === 'Pending').length} pending</p>
        </div>
        <button id="add-complaint-btn" className="btn btn-primary" onClick={() => setModal(true)}><MdAdd /> New Complaint</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card">
          <div className="section-title"><MdReport /> Complaints by Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={complaintCats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {complaintCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment analysis */}
        <div className="card">
          <div className="section-title"><MdSmartToy /> AI Sentiment Analysis</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Automated sentiment classification of all complaints using AI</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Positive', sentimentPos, '#10b981'], ['Negative', sentimentNeg, '#ef4444'], ['Neutral', sentimentNeu, '#f59e0b']].map(([label, count, color]) => {
              const total = complaints.length || 1;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 700, color }}>{count} ({Math.round((count / total) * 100)}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99 }}>
                    <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🤖 AI analyses complaint text using NLP to classify sentiment automatically
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {/* Complaints list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div className="empty-state"><p>Loading complaints...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><p>No complaints found</p></div>
        ) : (
          filtered.map(c => (
            <div key={c._id} className="card" style={{ padding: '20px 24px', transition: 'all 0.2s ease', position: 'relative', borderLeft: `4px solid ${c.priority === 'High' ? 'var(--danger)' : c.priority === 'Medium' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{c.title}</h3>
                    <span className={`badge badge-${c.priority?.toLowerCase()}`}>{c.priority}</span>
                    <span className={`badge badge-${c.status === 'Resolved' ? 'success' : c.status === 'In Progress' ? 'progress' : c.status === 'Acknowledged' ? 'paid' : 'pending'}`}>{c.status}</span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6, maxWidth: '85%' }}>{c.description}</p>

                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>👤</div>
                      <span style={{ fontWeight: 500 }}>{c.student?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MdReport size={14} />
                      <span>{c.category || 'Unknown'}</span>
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MdAccessTime size={14} />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '2px 10px', color: 'var(--accent-light)' }}>
                      <SentimentIcon s={c.sentiment} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>AI: {c.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                  {(user?.role === 'admin' || user?.role === 'warden') && c.status !== 'Resolved' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {['In Progress', 'Resolved', 'Acknowledged'].filter(s => s !== c.status).map(s => (
                        <button key={s} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => updateStatus(c._id, s)}>{s}</button>
                      ))}
                    </div>
                  )}

                  {(user?.role === 'admin' || user?._id === c.student?._id || user?.id === c.student?._id) && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="btn btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      <MdDelete size={16} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Complaint Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">📝 Submit Complaint</div>
              <button className="modal-close" onClick={() => setModal(false)}><MdClose /></button>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title for your complaint" />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea className="input" rows={4} style={{ resize: 'vertical' }} value={form.description} onChange={e => handleDescChange(e.target.value)} placeholder="Describe your issue in detail..." />
            </div>

            {/* AI Preview */}
            {aiResult && (
              <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 700, marginBottom: 8 }}>🤖 AI Classification Preview</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: <strong style={{ color: 'var(--text-primary)' }}>{aiResult.emoji} {aiResult.category}</strong></span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority: <strong className={`badge badge-${aiResult.priority.toLowerCase()}`}>{aiResult.priority}</strong></span>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting && <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} />}
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
