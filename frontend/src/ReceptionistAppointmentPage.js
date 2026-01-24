import React, { useState, useEffect } from 'react';
import './ReceptionistAppointmentPage.css';

export default function ReceptionistAppointmentPage({ user, setCurrentPage }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorTimings, setDoctorTimings] = useState([]);
  const [filteredTimings, setFilteredTimings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPatientRegistration, setShowPatientRegistration] = useState(false);
  const [formData, setFormData] = useState({
    Patient_p_id: '',
    Doctor_d_id: '',
    timing_id: '',
    appointment_mode: 'Self',
    slot_id: '',
    ap_date: ''
  });
  const [patientFormData, setPatientFormData] = useState({
    p_name: '',
    phone_no: '',
    CNIC: '',
    gender: '',
    Blood_Group: '',
    Relative_name: '',
    age: '',
    weight: '',
    ward_id: '',
    department: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  // Add route change listener to refresh data when navigating back
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('Route changed, refreshing appointment data...');
      fetchAppointments();
      fetchPatients();
      fetchDoctors();
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Also refresh when component becomes visible after navigation
    const handleFocus = () => {
      console.log('Component focused after navigation, refreshing data...');
      fetchAppointments();
      fetchPatients();
      fetchDoctors();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add periodic refresh to keep data fresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic refresh triggered...');
      fetchAppointments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching fresh appointments from database...');
      const res = await fetch('http://localhost:5000/api/receptionist/appointments', {
        headers: {
          role: 'receptionist',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fresh appointments data:', data);
        setAppointments(data);
      } else {
        console.error('Failed to fetch appointments:', res.status);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/patients/without-appointments', {
        headers: {
          role: 'receptionist',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doctors/with-timings', {
        headers: {
          role: 'receptionist',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchDoctorTimings = async (doctorId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${doctorId}/timings`, {
        headers: { role: 'receptionist' }
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorTimings(data);
      }
    } catch (err) {
      console.error('Error fetching doctor timings:', err);
    }
  };

  const fetchSlots = async (timingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/slots?timing_id=${timingId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (dateValue) => {
    setFormData(prev => ({ ...prev, ap_date: dateValue }));

    // Determine day from the precomputed list to avoid timezone parsing issues
    const dates = getAvailableDates();
    const match = dates.find(d => d.date === dateValue);
    const dayOfWeek = match ? match.day : null;

    const availableTimings = dayOfWeek
      ? doctorTimings.filter(timing => timing.day_of_week === dayOfWeek)
      : [];
    setFilteredTimings(availableTimings);

    // Reset timing and slot selection
    setFormData(prev => ({
      ...prev,
      ap_date: dateValue,
      timing_id: '',
      slot_id: ''
    }));
    setSlots([]);
  };

  const handleDoctorChange = (doctorId) => {
    setFormData(prev => ({
      ...prev,
      Doctor_d_id: doctorId,
      timing_id: '',
      slot_id: '',
      ap_date: ''
    }));
    setDoctorTimings([]);
    setFilteredTimings([]);
    setSlots([]);

    if (doctorId) {
      fetchDoctorTimings(doctorId);
    }
  };

  const handleTimingChange = (timingId) => {
    setFormData(prev => ({
      ...prev,
      timing_id: timingId,
      slot_id: ''
    }));
    setSlots([]);

    if (timingId) {
      fetchSlots(timingId);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'receptionist'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('✅ Appointment created successfully!');
        setShowCreateForm(false);
        setFormData({
          Patient_p_id: '',
          Doctor_d_id: '',
          timing_id: '',
          appointment_mode: 'Self',
          slot_id: '',
          ap_date: ''
        });
        fetchAppointments();
        fetchPatients(); // Refresh patient list
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('❌ Error creating appointment');
    }
  };

  const handlePatientRegistration = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/receptionist/patient/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'receptionist'
        },
        body: JSON.stringify(patientFormData)
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Patient registered successfully! Patient ID: ${result.p_id}`);
        setShowPatientRegistration(false);
        setPatientFormData({
          p_name: '',
          phone_no: '',
          CNIC: '',
          gender: '',
          Blood_Group: '',
          Relative_name: '',
          age: '',
          weight: '',
          ward_id: '',
          department: ''
        });
        fetchPatients(); // Refresh patient list
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error registering patient:', err);
      alert('❌ Error registering patient');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: { role: 'receptionist' }
      });

      if (res.ok) {
        alert('✅ Appointment cancelled successfully!');
        fetchAppointments();
        fetchPatients(); // Refresh patient list
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('❌ Error cancelling appointment');
    }
  };

  const resetAllSlots = async () => {
    if (!window.confirm('Are you sure you want to reset all slots? This will make all slots available.')) {
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/slots/reset', {
        method: 'PUT',
        headers: { role: 'receptionist' }
      });

      if (res.ok) {
        alert('✅ All slots reset successfully!');
        fetchAppointments();
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error resetting slots:', err);
      alert('❌ Error resetting slots');
    }
  };

  const generateBill = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/bill`, {
        headers: {
          role: 'receptionist',
          receptionist_name: user.name || user.username
        }
      });

      if (res.ok) {
        const billData = await res.json();
        const shouldNavigate = window.confirm(`✅ Bill generated successfully!\n\nBill ID: ${billData.fee_id}\nPatient: ${billData.patient_name}\nDoctor: ${billData.doctor_name}\nTotal Amount: $${billData.total}\n\nWould you like to go to the Billing page to view the complete bill, print it, and mark as completed?`);

        if (shouldNavigate && setCurrentPage) {
          setCurrentPage('billing');
        }

        fetchAppointments(); // Refresh to show updated status
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      alert('❌ Error generating bill');
    }
  };

  const viewBill = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/bill/view`, {
        headers: { role: 'receptionist' }
      });

      if (res.ok) {
        const billData = await res.json();
        alert(`Bill Details:\nFee ID: ${billData.fee_id}\nTotal: $${billData.total}\nStatus: ${billData.status}`);
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error viewing bill:', err);
      alert('❌ Error viewing bill');
    }
  };

  // Get available dates for the selected doctor (next 2 weeks)
  const getAvailableDates = () => {
    if (!doctorTimings.length) return [];

    const availableDates = [];
    const today = new Date();
    const nextTwoWeeks = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));

    // Get unique days from doctorTimings
    const availableDays = [...new Set(doctorTimings.map(t => t.day_of_week))];

    for (let d = new Date(today); d <= nextTwoWeeks; d.setDate(d.getDate() + 1)) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
      if (availableDays.includes(dayName)) {
        availableDates.push({
          date: formatLocalDate(d),
          day: dayName
        });
      }
    }

    return availableDates;
  };

  const showPrescription = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, {
        headers: { role: 'receptionist' }
      });

      if (res.ok) {
        const prescriptionData = await res.json();
        if (prescriptionData.length > 0) {
          const prescription = prescriptionData[0];
          alert(`Prescription Details:\nDiagnosis: ${prescription.diagnosis}\nFollow-up Required: ${prescription.follow_up_required ? 'Yes' : 'No'}\nNotes: ${prescription.notes || 'None'}`);
        } else {
          alert('No prescription found for this appointment. Doctor has not submitted prescription yet.');
        }
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error viewing prescription:', err);
      alert('❌ Error viewing prescription');
    }
  };

  const viewDetails = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        headers: { role: 'receptionist' }
      });

      if (res.ok) {
        const details = await res.json();
        alert(`Appointment Details:\nPatient: ${details.p_name}\nDoctor: ${details.d_name}\nDepartment: ${details.dept_name}\nDate: ${new Date(details.ap_date).toLocaleDateString()}\nTime: ${details.slot_start} - ${details.slot_end}\nStatus: ${details.status || 'Scheduled'}`);
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error viewing details:', err);
      alert('❌ Error viewing details');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    const color = statusColors[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status || 'Scheduled'}</span>;
  };

  const refreshAppointmentStatus = async (appointmentId) => {
    try {
      console.log('Refreshing status for appointment:', appointmentId);
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        headers: {
          role: 'receptionist',
          'Cache-Control': 'no-cache'
        }
      });

      if (res.ok) {
        const statusData = await res.json();
        console.log('Refreshed appointment status:', statusData);

        // Update the appointment status in the local state
        setAppointments(prevAppointments =>
          prevAppointments.map(appointment =>
            appointment.ap_id === appointmentId
              ? { ...appointment, status: statusData.status }
              : appointment
          )
        );

        return statusData.status;
      } else {
        console.error('Failed to refresh appointment status:', res.status);
        return null;
      }
    } catch (err) {
      console.error('Error refreshing appointment status:', err);
      return null;
    }
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered...');
    await fetchAppointments();
    await fetchPatients();
    await fetchDoctors();

    // Also refresh status for each appointment individually
    for (const appointment of appointments) {
      await refreshAppointmentStatus(appointment.ap_id);
    }

    alert('✅ Data refreshed successfully!');
  };

  return (
    <div className="receptionist-page container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Receptionist Dashboard</h1>
        <div className="dashboard-actions">

  <button
    onClick={() => setShowCreateForm(!showCreateForm)}
    className="btn-primary"
  >
    {showCreateForm ? 'Cancel' : 'Create Appointment'}
  </button>

  <button
    onClick={() => setShowPatientRegistration(!showPatientRegistration)}
    className="btn-accent"
  >
    {showPatientRegistration ? 'Cancel' : 'Register New Patient'}
  </button>

  <button
    onClick={resetAllSlots}
    className="btn-warn"
  >
    Reset All Slots
  </button>

  <button
    onClick={handleRefresh}
    className="btn-secondary"
  >
    🔄 Refresh
  </button>

</div>

      </div>

      {/* Patient Registration Form */}
      {showPatientRegistration && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
          <form onSubmit={handlePatientRegistration} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={patientFormData.p_name}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, p_name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="text"
                required
                value={patientFormData.phone_no}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, phone_no: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CNIC *</label>
              <input
                type="text"
                required
                value={patientFormData.CNIC}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, CNIC: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                required
                value={patientFormData.gender}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group *</label>
              <select
                required
                value={patientFormData.Blood_Group}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, Blood_Group: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relative Name *</label>
              <input
                type="text"
                required
                value={patientFormData.Relative_name}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, Relative_name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                value={patientFormData.age}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, age: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                value={patientFormData.weight}
                onChange={(e) => setPatientFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Register Patient
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Appointment Form */}
      {showCreateForm && (
        <div className="bg-black  p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Appointment</h2>
          <form onSubmit={handleCreateAppointment} className="grid grid-cols-2 gap-4">

            <div>
              <label>Patient *</label>
              <select
                required
                value={formData.Patient_p_id}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, Patient_p_id: e.target.value }))
                }
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.p_id} value={patient.p_id}>
                    {patient.p_name} - {patient.Blood_Group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Doctor *</label>
              <select
                required
                value={formData.Doctor_d_id}
                onChange={(e) => handleDoctorChange(e.target.value)}
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.d_id} value={doctor.d_id}>
                    {doctor.d_name} - {doctor.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Date *</label>
              <select
                required
                value={formData.ap_date}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!formData.Doctor_d_id || doctorTimings.length === 0}
              >
                <option value="">Select Date</option>
                {getAvailableDates().map(date => (
                  <option key={date.date} value={date.date}>
                    {new Date(date.date + 'T00:00:00').toLocaleDateString()} ({date.day})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Timing *</label>
              <select
                required
                value={formData.timing_id}
                onChange={(e) => handleTimingChange(e.target.value)}
                disabled={!formData.ap_date || filteredTimings.length === 0}
              >
                <option value="">Select Timing</option>
                {filteredTimings.map(timing => (
                  <option key={timing.timing_id} value={timing.timing_id}>
                    {timing.day_of_week} - {timing.start_time} to {timing.end_time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Slot *</label>
              <select
                required
                value={formData.slot_id}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, slot_id: e.target.value }))
                }
                disabled={!formData.timing_id}
              >
                <option value="">Select Slot</option>
                {slots.map(slot => (
                  <option
                    key={slot.slot_id}
                    value={slot.slot_id}
                    disabled={slot.is_booked}
                  >
                    {slot.slot_start} - {slot.slot_end}
                    {slot.is_booked ? ' (Booked)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Appointment Mode *</label>
              <select
                required
                value={formData.appointment_mode}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, appointment_mode: e.target.value }))
                }
              >
                <option value="Self">Self</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div className="col-span-2">
              <button type="submit" className="btn-primary w-full">
                Create Appointment
              </button>
            </div>

          </form>

        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Appointments</h2>
        </div>
<div className="bg-white rounded-lg shadow-md">
          <table className="appointments-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Patient Details</th>
      <th>Doctor Details</th>
      <th>Date & Time</th>
      <th>Mode</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {appointments.map(appointment => (
      <tr key={appointment.ap_id}>
        <td className="accent">{appointment.ap_id}</td>

        <td>
          <div className="cell-stack">
            <div className="cell-title">{appointment.p_name}</div>
            <div className="muted">Phone: {appointment.phone_no}</div>
            <div className="muted">Blood: {appointment.Blood_Group}</div>
            <div className="muted">Gender: {appointment.gender}</div>
          </div>
        </td>

        <td>
          <div className="cell-stack">
            <div className="cell-title">{appointment.d_name}</div>
            <div className="muted">{appointment.doctor_department}</div>
          </div>
        </td>

        <td>
          <div className="cell-stack">
            <div className="cell-title">
              {new Date(appointment.ap_date).toLocaleDateString()}
            </div>
            <div className="muted">
              {appointment.slot_start} – {appointment.slot_end}
            </div>
            <div className="muted">{appointment.day_of_week}</div>
          </div>
        </td>

        <td>
          <span className={`badge ${appointment.appointment_mode === 'Self'
            ? 'mode-self'
            : 'mode-staff'
          }`}>
            {appointment.appointment_mode}
          </span>
        </td>

        <td>
          {getStatusBadge(appointment.status)}
          <button
            onClick={() => refreshAppointmentStatus(appointment.ap_id)}
            className="icon-btn"
            title="Refresh Status"
          >
            🔄
          </button>
        </td>

        <td>
          <div className="action-stack">
            {appointment.status !== 'Completed' &&
              appointment.status !== 'Cancelled' && (
                <button
                  onClick={() => cancelAppointment(appointment.ap_id)}
                  className="action danger"
                >
                  Cancel
                </button>
              )}

            <button
              onClick={() => showPrescription(appointment.ap_id)}
              className="action info"
            >
              Show Prescription
            </button>

            <button
              onClick={() => viewDetails(appointment.ap_id)}
              className="action neutral"
            >
              View Details
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>

          {appointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No appointments found. Create your first appointment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
