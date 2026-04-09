import { MdPeople, MdSearch, MdSchool, MdBlock, MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Students() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    course: '',
    year: '',
    rollNumber: '',
    room: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=student');
      setStudents(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms');
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      course: '',
      year: '',
      rollNumber: '',
      room: ''
    });
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setEditingStudent(s);
    setForm({
      name: s.name || '',
      email: s.email || '',
      password: '', // Don't show password for edit
      phone: s.phone || '',
      course: s.course || '',
      year: s.year || '',
      rollNumber: s.rollNumber || '',
      room: s.room?._id || s.room || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this student?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Student deactivated successfully');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        // Edit student
        const updateData = { ...form };
        delete updateData.password; // Don't update password here
        await api.put(`/users/${editingStudent._id}`, updateData);
        toast.success('Student updated successfully');
      } else {
        // Add student
        await api.post('/auth/register', { ...form, role: 'student' });
        toast.success('Student registered successfully');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = students.filter(s =>
    (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
    (s.course && s.course.toLowerCase().includes(search.toLowerCase())) ||
    (s.room && s.room.number && s.room.number.toString().includes(search)) ||
    (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} registered students</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 34, fontSize: '0.85rem', width: 250 }} placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAddModal}><MdAdd /> Add Student</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card purple"><div className="stat-icon"><MdPeople /></div><div className="stat-value">{students.length}</div><div className="stat-label">Total Students</div></div>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{students.filter(s => s.isActive).length}</div><div className="stat-label">Active</div></div>
        <div className="stat-card orange"><div className="stat-icon"><MdBlock /></div><div className="stat-value">{students.filter(s => !s.isActive).length}</div><div className="stat-label">Inactive</div></div>
        <div className="stat-card cyan"><div className="stat-icon"><MdSchool /></div><div className="stat-value">{[...new Set(students.map(s => s.course).filter(Boolean))].length}</div><div className="stat-label">Courses</div></div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead><tr><th>Student</th><th>Roll No</th><th>Room</th><th>Course</th><th>Year</th><th>Phone</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading students...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No students found</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: 'var(--accent-light)', color: '#fff' }}>{s.avatar || (s.name ? s.name[0] : 'U')}</div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.rollNumber || '-'}</td>
                    <td>{s.room?.number ? `#${s.room.number}` : s.room ? 'Assigned' : 'Unassigned'}</td>
                    <td>{s.course || '-'}</td>
                    <td>{s.year ? `Year ${s.year}` : '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.phone || '-'}</td>
                    <td><span className={`badge badge-${s.isActive ? 'active' : 'inactive'}`} style={{ background: s.isActive ? '#10b98122' : '#ef444422', color: s.isActive ? '#10b981' : '#ef4444' }}>{s.isActive ? 'Active' : 'Deactivated'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon" title="Edit student" style={{ padding: 6 }} onClick={() => openEditModal(s)}><MdEdit size={16} /></button>
                        <button className="btn btn-icon" title="Deactivate student" style={{ padding: 6, color: 'var(--danger)' }} onClick={() => handleDelete(s._id)}><MdDelete size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">{editingStudent ? '✏️ Edit Student' : '👤 Register New Student'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@livora.edu" />
                </div>
                {!editingStudent && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" required className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: editingStudent ? 'span 2' : 'auto' }}>
                  <label>Phone Number</label>
                  <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label>Course</label>
                  <input className="input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="B.Tech CSE" />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select className="input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Roll Number</label>
                  <input className="input" value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} placeholder="CS2022001" />
                </div>
                <div className="form-group">
                  <label>Room Assignment</label>
                  <select className="input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                    <option value="">Select Room</option>
                    {rooms.map(r => (
                      <option key={r._id} value={r._id}>Room #{r.number} (Blk {r.block}) - {r.status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
