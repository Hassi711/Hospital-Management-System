import React, { useState, useEffect } from 'react';

export default function DoctorDashboardPage({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [prescriptionForm, setPrescriptionForm] = useState({});
  const [showFormFor, setShowFormFor] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
    fetchMedicines();
  }, [currentFilter]);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments for filter:', currentFilter);
      const res = await fetch(`http://localhost:5000/api/doctor/${user.staff_id}/appointments?filter=${currentFilter}`, { 
        headers: { role: 'doctor' } 
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Appointments data:', data);
        setAppointments(data.appointments || []); // Always expect data.appointments
        if (currentFilter === 'today') {
          setCompletedCount(data.completed_count || 0);
          setRemainingCount(data.remaining_count || 0);
        } else {
          setCompletedCount(0);
          setRemainingCount(data.appointments ? data.appointments.length : 0);
        }
      } else {
        console.error('Failed to fetch appointments:', res.status);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/medicines');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const handlePrescriptionChange = (e) => {
    setPrescriptionForm({ ...prescriptionForm, [e.target.name]: e.target.value });
  };

  const handleMedicineChange = (m_id, checked) => {
    if (checked) {
      setSelectedMedicines([...selectedMedicines, { m_id, quantity: 1 }]);
    } else {
      setSelectedMedicines(selectedMedicines.filter(m => m.m_id !== m_id));
    }
  };

  const handleMedicineQuantityChange = (m_id, quantity) => {
    setSelectedMedicines(selectedMedicines.map(m => m.m_id === m_id ? { ...m, quantity: Number(quantity) } : m));
  };

  const handlePrescriptionSubmit = async (ap_id) => {
    try {
      const body = {
        ...prescriptionForm,
        medicines: selectedMedicines
      };
      const res = await fetch(`http://localhost:5000/api/appointments/${ap_id}/prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', role: 'doctor' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowFormFor(null);
        setPrescriptionForm({});
        setSelectedMedicines([]);
        fetchAppointments();
        alert('Prescription submitted successfully!');
      } else {
        const errorData = await res.json();
        alert(`Error submitting prescription: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error submitting prescription:', err);
      alert('Error submitting prescription. Please try again.');
    }
  };

  const getFilterTitle = () => {
    switch(currentFilter) {
      case 'today': return "Today's Appointments";
      case 'next_day': return "Tomorrow's Appointments";
      case 'week': return "This Week's Appointments";
      case 'all': return "All Appointments";
      default: return "All Appointments";
    }
  };

  const renderPrescriptionForm = (ap_id) => (
    <form onSubmit={e => { e.preventDefault(); handlePrescriptionSubmit(ap_id); }} style={{ marginTop: 10, marginBottom: 10 }}>
      <div>
        <label>Diagnosis: </label>
        <input name="diagnosis" value={prescriptionForm.diagnosis || ''} onChange={handlePrescriptionChange} required />
      </div>
      <div>
        <label>Follow-up Required: </label>
        <select name="follow_up_required" value={prescriptionForm.follow_up_required || '0'} onChange={handlePrescriptionChange}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <div>
        <label>Follow-up Date: </label>
        <input name="follow_up_date" type="date" value={prescriptionForm.follow_up_date || ''} onChange={handlePrescriptionChange} disabled={prescriptionForm.follow_up_required !== '1'} />
      </div>
      <div>
        <label>Notes: </label>
        <input name="notes" value={prescriptionForm.notes || ''} onChange={handlePrescriptionChange} />
      </div>
      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <label>Medicines:</label>
        <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #ccc', padding: 5 }}>
          {medicines.map(med => {
            const selected = selectedMedicines.find(m => m.m_id === med.m_id);
            const isOutOfStock = med.quantity <= 0 || med.quantity === null;
            
            return (
              <div key={med.m_id} style={{ 
                marginBottom: 4, 
                opacity: isOutOfStock ? 0.5 : 1,
                color: isOutOfStock ? '#999' : 'inherit'
              }}>
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={e => handleMedicineChange(med.m_id, e.target.checked)}
                  disabled={isOutOfStock}
                />
                {med.m_name} (Price: ${med.price})
                {med.quantity !== null && (
                  <span style={{ 
                    color: isOutOfStock ? '#e74c3c' : '#27ae60',
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    - Stock: {med.quantity}
                  </span>
                )}
                {selected && !isOutOfStock && (
                  <input
                    type="number"
                    min="1"
                    max={med.quantity}
                    value={selected.quantity}
                    onChange={e => handleMedicineQuantityChange(med.m_id, e.target.value)}
                    style={{ width: 50, marginLeft: 8 }}
                  />
                )}
                {isOutOfStock && (
                  <span style={{ color: '#e74c3c', marginLeft: '5px', fontSize: '12px' }}>
                    (Out of Stock)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <button type="submit" style={{ marginTop: 5, padding: 5, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 3 }}>Submit Prescription</button>
      <button type="button" onClick={() => { setShowFormFor(null); setSelectedMedicines([]); }} style={{ marginLeft: 5, padding: 5 }}>Cancel</button>
    </form>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Doctor Dashboard</h2>
      
      {/* Filter Buttons */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => setCurrentFilter('all')}
          style={{ 
            padding: '8px 16px', 
            marginRight: 10,
            backgroundColor: currentFilter === 'all' ? '#3498db' : '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          All
        </button>
        <button 
          onClick={() => setCurrentFilter('today')}
          style={{ 
            padding: '8px 16px', 
            marginRight: 10,
            backgroundColor: currentFilter === 'today' ? '#3498db' : '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Today
        </button>
        <button 
          onClick={() => setCurrentFilter('next_day')}
          style={{ 
            padding: '8px 16px', 
            marginRight: 10,
            backgroundColor: currentFilter === 'next_day' ? '#3498db' : '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Tomorrow
        </button>
        <button 
          onClick={() => setCurrentFilter('week')}
          style={{ 
            padding: '8px 16px', 
            marginRight: 10,
            backgroundColor: currentFilter === 'week' ? '#3498db' : '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          This Week
        </button>
        <button 
          onClick={fetchAppointments}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <h3>{getFilterTitle()}</h3>
      
      {/* Statistics for Today */}
      {currentFilter === 'today' && (
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#e9ecef', borderRadius: 5 }}>
          <h4>Today's Statistics</h4>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <strong>Successfully Attended:</strong> {completedCount} patients
            </div>
            <div>
              <strong>Remaining Appointments:</strong> {remainingCount} patients
            </div>
            <div>
              <strong>Total Today:</strong> {completedCount + remainingCount} patients
            </div>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Patient</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Date</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Time</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(appointments) && appointments.length > 0 ? (
            appointments.map(appt => (
              <tr key={appt.ap_id}>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{appt.ap_id}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{appt.p_name}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{new Date(appt.ap_date).toLocaleDateString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{appt.slot_start} - {appt.slot_end}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <span 
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: appt.status === 'Completed' ? '#28a745' : '#ffc107',
                      color: appt.status === 'Completed' ? 'white' : 'black'
                    }}
                  >
                    {appt.status || 'Scheduled'}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  {appt.status === 'Completed' ? (
                    <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Completed</span>
                  ) : (
                    <button 
                      onClick={() => { setShowFormFor(appt.ap_id); setPrescriptionForm({}); setSelectedMedicines([]); }} 
                      style={{ padding: 5, backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 3 }}
                    >
                      Write Prescription
                    </button>
                  )}
                  {showFormFor === appt.ap_id && renderPrescriptionForm(appt.ap_id)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: 20, border: '1px solid #ddd' }}>
                No appointments found for {getFilterTitle().toLowerCase()}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
