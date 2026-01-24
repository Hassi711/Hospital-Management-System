import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/departments';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ department_id: '', department_name: '', budget: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setDepartments);
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
        body: JSON.stringify({ department_name: form.department_name, budget: form.budget }),
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

  const handleEdit = dept => {
    setEditingId(dept.department_id);
    setForm({ department_id: dept.department_id, department_name: dept.department_name, budget: dept.budget });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Departments</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="department_id" placeholder="Department ID" value={form.department_id} onChange={handleChange} required disabled={!!editingId} />
        <input name="department_name" placeholder="Department Name" value={form.department_name} onChange={handleChange} required />
        <input name="budget" placeholder="Budget" value={form.budget} onChange={handleChange} />
        <button type="submit">{editingId ? 'Update' : 'Add'} Department</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ department_id: '', department_name: '', budget: '' }); }}>Cancel</button>}
      </form>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Budget</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.department_id}>
              <td>{dept.department_id}</td>
              <td>{dept.department_name}</td>
              <td>{dept.budget}</td>
              <td>
                <button onClick={() => handleEdit(dept)}>Edit</button>
                <button onClick={() => handleDelete(dept.department_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 