import React, { useState } from 'react';

const ENTITY_CONFIG = {
  staff: { label: 'All Staff', endpoint: '/api/staff' },
  admin: { label: 'Admin', endpoint: '/api/admins' },
  doctor: { label: 'Doctor', endpoint: '/api/doctors' },
  surgeon: { label: 'Surgeon', endpoint: '/api/surgeons' },
  receptionist: { label: 'Receptionist', endpoint: '/api/receptionists' },
  nurse: { label: 'Nurse', endpoint: '/api/nurses' },
  intern: { label: 'Intern', endpoint: '/api/interns' },
  patient: { label: 'Patient', endpoint: '/api/patients' },
};

export default function StaffPage() {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    s_id: '',
    s_name: '',
    Roll_r_id: '',
    experience: '',
    Staff_s_id: '',
    Shift_shift_id: '',
    Address_id: '',
    CNIC: '',
    ph_number: '',
    Gender: '',
    Specialization_sp_id: '',
    Department_dept_id: ''
  });

  const fetchData = async (entityKey) => {
    setMessage('');
    setSelectedEntity(entityKey);
    setData([]);
    setColumns([]);
    setShowAddForm(false);
    try {
      const res = await fetch(`http://localhost:5000${ENTITY_CONFIG[entityKey].endpoint}`);
      if (!res.ok) {
        setMessage('Error fetching data');
        return;
      }
      const result = await res.json();
      setData(result);
      if (result.length > 0) {
        setColumns(Object.keys(result[0]));
      }
    } catch {
      setMessage('Server error');
    }
  };

  const handleDelete = async (idField, idValue) => {
    setMessage('');
    let endpoint = ENTITY_CONFIG[selectedEntity].endpoint;
    if (endpoint.endsWith('s')) endpoint = endpoint.slice(0, -1);
    try {
      const res = await fetch(`http://localhost:5000${endpoint}/${idValue}`, { method: 'DELETE' });
      if (!res.ok) {
        setMessage('Error deleting record');
        return;
      }
      setMessage('Deleted successfully');
      fetchData(selectedEntity);
    } catch {
      setMessage('Server error');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const dataToSend = {};
    Object.keys(form).forEach(key => {
      dataToSend[key] = form[key] === '' ? null : form[key];
    });
    try {
      const res = await fetch('http://localhost:5000/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setMessage(errorData.error || 'Error adding staff');
        return;
      }
      setMessage('Staff added successfully!');
      setForm({
        s_id: '',
        s_name: '',
        Roll_r_id: '',
        experience: '',
        Staff_s_id: '',
        Shift_shift_id: '',
        Address_id: '',
        CNIC: '',
        ph_number: '',
        Gender: '',
        Specialization_sp_id: '',
        Department_dept_id: ''
      });
      setShowAddForm(false);
      if (selectedEntity) fetchData(selectedEntity);
    } catch {
      setMessage('Server error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Staff Management</h2>
      <button onClick={() => setShowAddForm(true)} style={{ marginBottom: 16 }}>Add Staff</button>
      {!showAddForm && (
        <div style={{ marginBottom: 20 }}>
          {Object.entries(ENTITY_CONFIG).map(([key, { label }]) => (
            <button key={key} onClick={() => fetchData(key)} style={{ marginRight: 8 }}>{label}</button>
          ))}
        </div>
      )}
      {message && <div style={{ color: message.includes('error') ? 'red' : 'green' }}>{message}</div>}
      {showAddForm ? (
        <form onSubmit={handleAddSubmit} style={{ marginBottom: 20 }}>
          <input name="s_id" placeholder="Staff ID" value={form.s_id} onChange={handleChange} required />
          <input name="s_name" placeholder="Name" value={form.s_name} onChange={handleChange} required />
          <input name="Roll_r_id" placeholder="Role ID" value={form.Roll_r_id} onChange={handleChange} required />
          <input name="experience" placeholder="Experience" value={form.experience} onChange={handleChange} />
          <input name="Staff_s_id" placeholder="Supervisor Staff ID" value={form.Staff_s_id} onChange={handleChange} />
          <input name="Shift_shift_id" placeholder="Shift ID" value={form.Shift_shift_id} onChange={handleChange} />
          <input name="Address_id" placeholder="Address ID" value={form.Address_id} onChange={handleChange} required />
          <input name="CNIC" placeholder="CNIC" value={form.CNIC} onChange={handleChange} required />
          <input name="ph_number" placeholder="Phone Number" value={form.ph_number} onChange={handleChange} required />
          <input name="Gender" placeholder="Gender" value={form.Gender} onChange={handleChange} required />
          <input name="Specialization_sp_id" placeholder="Specialization ID" value={form.Specialization_sp_id} onChange={handleChange} />
          <input name="Department_dept_id" placeholder="Department ID" value={form.Department_dept_id} onChange={handleChange} />
          <button type="submit">Add Staff</button>
          <button type="button" onClick={() => setShowAddForm(false)} style={{ marginLeft: 8 }}>Cancel</button>
        </form>
      ) : null}
      {!showAddForm && data.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              {columns.map(col => <th key={col}>{col}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row[columns[0]]}>
                {columns.map(col => <td key={col}>{row[col]}</td>)}
                <td>
                  <button onClick={() => alert('Update not implemented yet')}>Update</button>
                  <button onClick={() => handleDelete(columns[0], row[columns[0]])}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 