import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/blood_groups';

export default function BloodGroupPage() {
  const [bloodGroups, setBloodGroups] = useState([]);
  const [form, setForm] = useState({ id: '', type: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setBloodGroups);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (editingId) {
      fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type }),
      }).then(() => window.location.reload());
    } else {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(() => window.location.reload());
    }
  };

  const handleDelete = id => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(() => window.location.reload());
  };

  const handleEdit = bg => {
    setEditingId(bg.id);
    setForm({ id: bg.id, type: bg.type });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Blood Groups</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="id" placeholder="ID" value={form.id} onChange={handleChange} required disabled={!!editingId} />
        <input name="type" placeholder="Type (e.g. A+, O-)" value={form.type} onChange={handleChange} required />
        <button type="submit">{editingId ? 'Update' : 'Add'} Blood Group</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ id: '', type: '' }); }}>Cancel</button>}
      </form>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th><th>Type</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bloodGroups.map(bg => (
            <tr key={bg.id}>
              <td>{bg.id}</td>
              <td>{bg.type}</td>
              <td>
                <button onClick={() => handleEdit(bg)}>Edit</button>
                <button onClick={() => handleDelete(bg.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 