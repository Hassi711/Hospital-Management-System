import React, { useEffect, useState } from 'react';
import './App.css';
import './PatientPage.css';
import ConfirmModal from './components/ConfirmModal';

const API_URL = 'http://localhost:5000/api/patients';
const BLOOD_API_URL = 'http://localhost:5000/api/blood_groups';
const WARD_API_URL = 'http://localhost:5000/api/wards';
const DEPT_API_URL = 'http://localhost:5000/api/departments';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

export default function PatientPage() {
  const [patients, setPatients] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, patientId: null, patientName: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsRes, bloodRes, wardsRes, deptsRes] = await Promise.all([
          fetch(API_URL),
          fetch(BLOOD_API_URL),
          fetch(WARD_API_URL),
          fetch(DEPT_API_URL)
        ]);
        
        setPatients(await patientsRes.json());
        setBloodGroups(await bloodRes.json());
        setWards(await wardsRes.json());
        setDepartments(await deptsRes.json());
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      setFilteredWards(
        wards.filter(w => String(w.department_id) === String(selectedDepartment))
      );
    } else {
      setFilteredWards([]);
    }
  }, [selectedDepartment, wards]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDepartmentChange = e => {
    setSelectedDepartment(e.target.value);
    setForm({ ...form, department_id: e.target.value, ward_id: '' });
  };

  const handleStep1Submit = e => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    const {
      p_id, p_name, admit_date, ward_id,
      Relative_name, phone_no, CNIC, gender, Blood_Group
    } = form;

    const department = selectedDepartment;

    const patientData = {
      p_id, p_name, admit_date, ward_id,
      Relative_name, phone_no, CNIC, gender, Blood_Group, department
    };

    try {
      if (editingId) {
        const response = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Reload patients to get fresh data
          const patientsRes = await fetch(API_URL);
          const updatedPatients = await patientsRes.json();
          setPatients(updatedPatients);
          handleCancel();
        }
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Reload patients to get fresh data with new ID
          const patientsRes = await fetch(API_URL);
          const updatedPatients = await patientsRes.json();
          setPatients(updatedPatients);
          handleCancel();
        }
      }
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleDeleteClick = (patient) => {
    setDeleteModal({
      isOpen: true,
      patientId: patient.p_id,
      patientName: patient.p_name
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.patientId) {
      fetch(`${API_URL}/${deleteModal.patientId}`, { 
        method: 'DELETE' 
      }).then(() => {
        setPatients(patients.filter(p => p.p_id !== deleteModal.patientId));
        setDeleteModal({ isOpen: false, patientId: null, patientName: '' });
      }).catch(error => {
        console.error('Delete error:', error);
        setDeleteModal({ isOpen: false, patientId: null, patientName: '' });
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, patientId: null, patientName: '' });
  };

  const handleEdit = patient => {
    setEditingId(patient.p_id);
    setForm(patient);
    setSelectedDepartment(patient.department_id || '');
    setStep(1);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({});
    setSelectedDepartment('');
    setStep(1);
  };

  const getDepartmentName = (id) => {
    const dept = departments.find(d => String(d.department_id) === String(id));
    return dept ? dept.department_name : id;
  };

  const getWardName = (id) => {
    const ward = wards.find(w => String(w.ward_id) === String(id));
    return ward ? ward.ward_name : id;
  };

  return (
    <div>
      <h2 className="page-title">Patients</h2>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="form-card">
          <div className="form-header">{editingId ? 'Edit Patient' : 'Add New Patient'}</div>
          <div className="input-group">
            <label>Patient ID</label>
            <input 
              className="input"
              name="p_id" 
              placeholder="Auto-generated if new" 
              value={form.p_id || ''} 
              onChange={handleChange} 
              disabled={!!editingId} 
            />
          </div>
          <div className="input-group">
            <label>Name</label>
            <input 
              className="input"
              name="p_name" 
              placeholder="Enter patient name" 
              value={form.p_name || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Admit Date</label>
            <input 
              className="input"
              name="admit_date" 
              placeholder="YYYY-MM-DD HH:MM:SS" 
              value={form.admit_date || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Relative Name</label>
            <input 
              className="input"
              name="Relative_name" 
              placeholder="Emergency contact name" 
              value={form.Relative_name || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <input 
              className="input"
              name="phone_no" 
              placeholder="Enter phone number" 
              value={form.phone_no || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>CNIC</label>
            <input 
              className="input"
              name="CNIC" 
              placeholder="Enter CNIC" 
              value={form.CNIC || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Gender</label>
            <select 
              className="select"
              name="gender" 
              value={form.gender || ''} 
              onChange={handleChange} 
              required
            >
              <option value="">Select Gender</option>
              {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Blood Group</label>
            <select 
              className="select"
              name="Blood_Group" 
              value={form.Blood_Group || ''} 
              onChange={handleChange} 
              required
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map(bg => <option key={bg.id} value={bg.type}>{bg.type}</option>)}
            </select>
          </div>
          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            )}
            <button type="submit" className="btn btn-primary">Next</button>
          </div>
        </form>
      )}

      {/* Step 2: Department & Ward */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="form-card">
          <div className="form-header">Select Department & Ward</div>
          <div className="input-group">
            <label>Department</label>
            <select 
              className="select"
              name="department_id" 
              value={selectedDepartment} 
              onChange={handleDepartmentChange} 
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Ward</label>
            <select 
              className="select"
              name="ward_id" 
              value={form.ward_id || ''} 
              onChange={handleChange} 
              required 
              disabled={!selectedDepartment}
            >
              <option value="">Select Ward</option>
              {filteredWards.map(ward => (
                <option key={ward.ward_id} value={ward.ward_id}>
                  {ward.ward_name} (Capacity: {ward.capacity})
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Patient</button>
          </div>
        </form>
      )}

      {/* Patients Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Admit Date</th>
              <th>Department</th>
              <th>Ward</th>
              <th>Relative Name</th>
              <th>Phone No</th>
              <th>CNIC</th>
              <th>Gender</th>
              <th>Blood Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.p_id}>
                <td>{p.p_id}</td>
                <td>{p.p_name}</td>
                <td>{p.admit_date}</td>
                <td>{getDepartmentName(p.department)}</td>
                <td>{getWardName(p.ward_id)}</td>
                <td>{p.Relative_name}</td>
                <td>{p.phone_no}</td>
                <td>{p.CNIC}</td>
                <td>{p.gender}</td>
                <td>{p.Blood_Group}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-success btn-small" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteClick(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message={`Are you sure you want to delete "${deleteModal.patientName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
