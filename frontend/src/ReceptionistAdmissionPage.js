import React, { useEffect, useMemo, useState } from 'react';
import './ReceptionistAdmissionPage.css';

export default function ReceptionistAdmissionPage({ user }) {
  const API = 'http://localhost:5000';

  // Form state
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [nurseForWard, setNurseForWard] = useState(null);

  const [form, setForm] = useState({
    patient_id: '',
    dept_id: '',
    ward_id: '',
    doctor_id: '',
    admission_type: 'Scheduled',
    reason: '',
    date_admitted: '',
    expected_discharge: '',
    surgery_required: false,
  });

  // Admissions list
  const [admissions, setAdmissions] = useState([]);
  const [isBusy, setIsBusy] = useState(false);

  const authHeaders = useMemo(() => ({
    role: 'receptionist',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Content-Type': 'application/json',
  }), []);

  const safeFetch = async (url, options = {}) => {
    const res = await fetch(url, { headers: authHeaders, ...options });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const d = await res.json(); msg = d.error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  useEffect(() => {
    loadPatients();
    loadDepartments();
    loadAdmissions();
  }, []);

  useEffect(() => {
    // When department changes, fetch wards
    if (form.dept_id) {
      loadWards(form.dept_id);
      // reset ward and nurse if department changes
      setForm(f => ({ ...f, ward_id: '' }));
      setNurseForWard(null);
    } else {
      setWards([]);
      setNurseForWard(null);
    }
  }, [form.dept_id]);

  useEffect(() => {
    // When ward changes, fetch nurse assignment
    if (form.ward_id) {
      loadWardNurse(form.ward_id);
    } else {
      setNurseForWard(null);
    }
  }, [form.ward_id]);

  const loadPatients = async () => {
    try {
      setIsBusy(true);
      const data = await safeFetch(`${API}/api/receptionist/patients/all`);
      setPatients(data);
    } catch (e) {
      alert(`Failed to load patients: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await safeFetch(`${API}/api/departments`);
      setDepartments(data);
    } catch (e) {
      alert(`Failed to load departments: ${e.message}`);
    }
  };

  const loadWards = async (deptId) => {
    try {
      setIsBusy(true);
      const data = await safeFetch(`${API}/api/wards/by-department/${deptId}`);
      setWards(data);
    } catch (e) {
      alert(`Failed to load wards: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const loadWardNurse = async (wardId) => {
    try {
      const data = await safeFetch(`${API}/api/wards/${wardId}/nurse`);
      setNurseForWard(data?.nurse_id ?? null);
    } catch (e) {
      setNurseForWard(null);
    }
  };

  const loadAdmissions = async () => {
    try {
      setIsBusy(true);
      const data = await safeFetch(`${API}/api/admissions`);
      setAdmissions(data);
    } catch (e) {
      alert(`Failed to load admissions: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const submitAdmission = async (e) => {
    e.preventDefault();
    try {
      setIsBusy(true);
      const payload = { ...form };
      if (!payload.date_admitted) delete payload.date_admitted;
      if (!payload.expected_discharge) delete payload.expected_discharge;
      payload.surgery_required = !!payload.surgery_required;
      await safeFetch(`${API}/api/admissions`, { method: 'POST', body: JSON.stringify(payload) });
      alert('✅ Patient admitted successfully');
      setForm({ patient_id: '', dept_id: '', ward_id: '', doctor_id: '', admission_type: 'Scheduled', reason: '', date_admitted: '', expected_discharge: '', surgery_required: false });
      await loadAdmissions();
    } catch (e) {
      alert(`❌ Failed to admit patient: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const addMedicine = async (admission_id) => {
    try {
      // Simple prompt UI for now
      const m_id = window.prompt('Enter medicine ID (m_id):');
      if (!m_id) return;
      const qtyStr = window.prompt('Enter quantity:');
      const quantity = Number(qtyStr || '1');
      if (!quantity || quantity <= 0) return alert('Invalid quantity');
      await safeFetch(`${API}/api/admissions/${admission_id}/medicine`, { method: 'POST', body: JSON.stringify({ m_id: Number(m_id), quantity }) });
      alert('✅ Medicine added');
    } catch (e) {
      alert(`❌ Failed to add medicine: ${e.message}`);
    }
  };

  const viewMedicines = async (admission_id) => {
    try {
      const rows = await safeFetch(`${API}/api/admissions/${admission_id}/medicines`);
      if (!rows.length) return alert('No medicines administered yet');
      const lines = rows.map(r => `${new Date(r.administered_at).toLocaleString()} - ${r.m_name} x${r.quantity}`).join('\n');
      alert(lines);
    } catch (e) {
      alert(`❌ Failed to load medicines: ${e.message}`);
    }
  };

  const dischargeAndBill = async (admission_id) => {
    try {
      if (!window.confirm('Discharge patient and generate bill?')) return;
      const data = await safeFetch(`${API}/api/admissions/${admission_id}/discharge-bill`, { method: 'POST' });
      alert(`✅ Discharged. Fee ID: ${data.fee_id}\nMedicine Total: $${data.medicine_total}\nTotal: $${data.total}`);
      await loadAdmissions();
    } catch (e) {
      alert(`❌ Failed to discharge: ${e.message}`);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadPatients(), loadDepartments(), loadAdmissions()]);
  };

  return (
    <div className="admission-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Patient Admission</h2>
        <button onClick={handleRefresh} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Refresh</button>
      </div>

      {/* Admission form */}
      <form onSubmit={submitAdmission} style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <div>
            <label>Patient</label>
            <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="">Select patient</option>
              {patients.map(p => (
                <option key={p.p_id} value={p.p_id}>{p.p_name} (ID: {p.p_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Department</label>
            <select value={form.dept_id} onChange={e => setForm({ ...form, dept_id: e.target.value })} required style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="">Select department</option>
              {departments.map(d => (
                <option key={d.department_id || d.dept_id} value={d.department_id || d.dept_id}>{d.department_name || d.dept_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Ward</label>
            <select value={form.ward_id} onChange={e => setForm({ ...form, ward_id: e.target.value })} required style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="">Select ward</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>{w.ward_name} (Cap: {w.capacity})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Nurse (auto)</label>
            <input value={nurseForWard || ''} readOnly placeholder="Auto from ward" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Doctor ID (optional)</label>
            <input value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} placeholder="Doctor ID" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Admission Type</label>
            <select value={form.admission_type} onChange={e => setForm({ ...form, admission_type: e.target.value })} required style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="Emergency">Emergency</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Referral">Referral</option>
            </select>
          </div>
          <div>
            <label>Reason</label>
            <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Date Admitted (optional)</label>
            <input type="datetime-local" value={form.date_admitted} onChange={e => setForm({ ...form, date_admitted: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Expected Discharge (optional)</label>
            <input type="datetime-local" value={form.expected_discharge} onChange={e => setForm({ ...form, expected_discharge: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="surg" type="checkbox" checked={form.surgery_required} onChange={e => setForm({ ...form, surgery_required: e.target.checked })} />
            <label htmlFor="surg">Surgery Required</label>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={isBusy} style={{ background: '#10b981', color: 'white', padding: '8px 14px', border: 'none', borderRadius: 6 }}>
            Admit Patient
          </button>
        </div>
      </form>

      {/* Admissions table */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0 }}>Current Admissions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>ID</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Patient</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Ward</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Doctor</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Type</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Admitted</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map(row => (
                <tr key={row.admission_id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.admission_id}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.p_name} (ID: {row.patient_id})</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.ward_name} (ID: {row.ward_id})</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.d_name || '—'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.admission_type}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{row.date_admitted ? new Date(row.date_admitted).toLocaleString() : '—'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', background: row.status === 'Discharged' ? '#10b981' : row.status === 'Scheduled' ? '#f59e0b' : '#3b82f6', color: 'white' }}>{row.status}</span>
                  </td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {row.status !== 'Discharged' && (
                        <button onClick={() => addMedicine(row.admission_id)} style={{ background: '#6f42c1', color: 'white', padding: '6px 10px', border: 'none', borderRadius: 6 }}>Add Medicine</button>
                      )}
                      <button onClick={() => viewMedicines(row.admission_id)} style={{ background: '#64748b', color: 'white', padding: '6px 10px', border: 'none', borderRadius: 6 }}>View Medicines</button>
                      {row.status !== 'Discharged' && (
                        <button onClick={() => dischargeAndBill(row.admission_id)} style={{ background: '#ef4444', color: 'white', padding: '6px 10px', border: 'none', borderRadius: 6 }}>Discharge & Generate Bill</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {admissions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No admissions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBusy && <div style={{ marginTop: 12, color: '#6b7280' }}>Loading...</div>}
    </div>
  );
}

