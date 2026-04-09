import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdAutoAwesome } from 'react-icons/md';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMPTY = { number: '', block: 'A', type: 'Single', capacity: 1, floor: 1, amenities: '' };
const BLOCKS = ['A', 'B', 'C', 'D'];
const TYPES = ['Single', 'Double', 'Triple'];
const STATUSES = ['Available', 'Occupied', 'Maintenance'];

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBlock, setFilterBlock] = useState('All');
  const [delConfirm, setDelConfirm] = useState(null);
  const [autoResult, setAutoResult] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms');
      setRooms(res.data.data || res.data.rooms || []);
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filtered = rooms.filter(r =>
    (filterStatus === 'All' || r.status === filterStatus) &&
    (filterBlock === 'All' || r.block === filterBlock)
  );

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('add'); };
  const openEdit = (r) => {
    setForm({ number: r.number, block: r.block, type: r.type, capacity: r.capacity, floor: r.floor, amenities: r.amenities?.join(', ') || '' });
    setEditId(r._id); setModal('edit');
  };

  const saveRoom = async () => {
    if (!form.number) { toast.error('Room number is required'); return; }
    try {
      const payload = {
        number: parseInt(form.number),
        block: form.block,
        type: form.type,
        capacity: parseInt(form.capacity),
        floor: parseInt(form.floor),
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean)
      };

      if (modal === 'add') {
        await api.post('/rooms', payload);
        toast.success('Room added successfully!');
      } else {
        await api.put(`/rooms/${editId}`, payload);
        toast.success('Room updated successfully!');
      }
      fetchRooms();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    }
  };

  const deleteRoom = async (id) => { 
    try {
      await api.delete(`/rooms/${id}`);
      setDelConfirm(null); 
      fetchRooms();
      toast.success('Room deleted'); 
    } catch (err) {
      setDelConfirm(null);
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleAutoAssign = async () => {
    try {
      toast.loading('AI is allocating rooms...', { id: 'auto-alloc' });
      const res = await api.post('/rooms/auto-allocate');
      if (res.data.success && res.data.assignments?.length > 0) {
        setAutoResult(res.data.assignments);
        toast.success(`AI suggested ${res.data.assignments.length} assignment(s)!`, { id: 'auto-alloc' });
        fetchRooms();
      } else {
        toast.error('No unassigned students or available rooms found.', { id: 'auto-alloc' });
      }
    } catch (err) {
      toast.error('Auto allocation failed.', { id: 'auto-alloc' });
    }
  };

  const statusColors = { Available: 'success', Occupied: 'paid', Maintenance: 'maintenance' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Management</h1>
          <p className="page-subtitle">{rooms.length} total rooms across {BLOCKS.length} blocks</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleAutoAssign}><MdAutoAwesome /> Auto Assign (AI)</button>
          <button id="add-room-btn" className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Room</button>
        </div>
      </div>

      {/* AI Auto Assign result */}
      {autoResult && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-light)' }}>🤖 AI Room Allocation Review</div>
            <button className="modal-close" onClick={() => setAutoResult(null)}><MdClose /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {autoResult.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{r.studentName}</span>
                <span style={{ color: 'var(--text-muted)' }}> → Room <strong style={{ color: 'var(--text-primary)' }}>{r.roomNumber}</strong> (Profile: {r.profile})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', ...STATUSES].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)}>{s}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} value={filterBlock} onChange={e => setFilterBlock(e.target.value)}>
            <option value="All">All Blocks</option>
            {BLOCKS.map(b => <option key={b} value={b}>Block {b}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {['Available', 'Occupied', 'Maintenance'].map(s => {
          const count = rooms.filter(r => r.status === s).length;
          const colors = { Available: 'green', Occupied: 'purple', Maintenance: 'orange' };
          return (
            <div key={s} className={`stat-card ${colors[s]}`} style={{ padding: '16px 20px' }}>
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>{count}</div>
              <div className="stat-label">{s}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr><th>Room No.</th><th>Block</th><th>Floor</th><th>Type</th><th>Capacity</th><th>Occupied</th><th>Status</th><th>Amenities</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading rooms...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No rooms found</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>#{r.number}</td>
                    <td>Block {r.block}</td>
                    <td>Floor {r.floor}</td>
                    <td>{r.type}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.occupiedCount || 0}/{r.capacity}
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-secondary)', borderRadius: 99, minWidth: 40 }}>
                          <div style={{ width: `${((r.occupiedCount || 0) / r.capacity) * 100}%`, height: '100%', background: (r.occupiedCount || 0) >= r.capacity ? 'var(--accent-danger)' : 'var(--accent-3)', borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${statusColors[r.status] || 'pending'}`}>{r.status}</span></td>
                    <td style={{ maxWidth: 160 }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{r.amenities?.map(a => <span key={a} style={{ fontSize: '0.7rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-muted)' }}>{a}</span>)}</div></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><MdEdit /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDelConfirm(r._id)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{modal === 'add' ? '➕ Add New Room' : '✏️ Edit Room'}</div>
              <button className="modal-close" onClick={() => setModal(null)}><MdClose /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label>Room Number *</label><input className="input" type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. 205" /></div>
              <div className="form-group"><label>Block</label><select className="input" value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))}>{BLOCKS.map(b => <option key={b} value={b}>Block {b}</option>)}</select></div>
              <div className="form-group"><label>Type</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="form-group"><label>Capacity</label><input className="input" type="number" min={1} max={4} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
              <div className="form-group"><label>Floor</label><input className="input" type="number" min={1} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Amenities (comma separated)</label><input className="input" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="AC, WiFi, Attached Bath" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRoom}>{modal === 'add' ? 'Add Room' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDelConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header"><div className="modal-title">🗑️ Delete Room?</div></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>This action cannot be undone. The room will be permanently removed.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteRoom(delConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
