import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/wards';
const DEPT_API_URL = 'http://localhost:5000/api/departments';

export default function WardPage() {
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ ward_id: '', ward_name: '', capacity: '', department_id: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setWards);
    fetch(DEPT_API_URL)
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
        body: JSON.stringify({ ward_name: form.ward_name, capacity: form.capacity, department_id: form.department_id }),
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

  const handleEdit = ward => {
    setEditingId(ward.ward_id);
    setForm({ ward_id: ward.ward_id, ward_name: ward.ward_name, capacity: ward.capacity, department_id: ward.department_id });
  };

  console.log("Wards:", wards);
  console.log("Departments:", departments);
  wards.forEach((ward, i) => {
    const match = departments.find(d => String(d.department_id) === String(ward.department_id));
    console.log(`Ward ${i}: ward_id=${ward.ward_id}, department_id=${ward.department_id}, match:`, match);
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Wards</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="ward_id" placeholder="Ward ID" value={form.ward_id} onChange={handleChange} required disabled={!!editingId} />
        <input name="ward_name" placeholder="Ward Name" value={form.ward_name} onChange={handleChange} required />
        <input name="capacity" placeholder="Capacity" value={form.capacity} onChange={handleChange} required />
        <select name="department_id" value={form.department_id || ''} onChange={handleChange} required>
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_id} - {dept.department_name}
            </option>
          ))}
        </select>
        <button type="submit">{editingId ? 'Update' : 'Add'} Ward</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ward_id: '', ward_name: '', capacity: '', department_id: '' }); }}>Cancel</button>}
      </form>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Capacity</th><th>Department</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {wards.map(ward => (
            <tr key={ward.ward_id}>
              <td>{ward.ward_id}</td>
              <td>{ward.ward_name}</td>
              <td>{ward.capacity}</td>
              <td>{ward.department_name}</td>
              <td>
                <button onClick={() => handleEdit(ward)}>Edit</button>
                <button onClick={() => handleDelete(ward.ward_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 