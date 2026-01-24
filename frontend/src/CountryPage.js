import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/countries';

export default function CountryPage() {
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({ country_id: '', name: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setCountries);
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
        body: JSON.stringify({ name: form.name }),
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

  const handleEdit = country => {
    setEditingId(country.country_id);
    setForm({ country_id: country.country_id, name: country.name });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Countries</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="country_id" placeholder="Country ID" value={form.country_id} onChange={handleChange} required disabled={!!editingId} />
        <input name="name" placeholder="Country Name" value={form.name} onChange={handleChange} required />
        <button type="submit">{editingId ? 'Update' : 'Add'} Country</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ country_id: '', name: '' }); }}>Cancel</button>}
      </form>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {countries.map(c => (
            <tr key={c.country_id}>
              <td>{c.country_id}</td>
              <td>{c.name}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.country_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 