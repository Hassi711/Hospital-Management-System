  import React, { useState, useEffect } from 'react';

  export default function PatientDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [doctorTimings, setDoctorTimings] = useState([]);
    const [filteredTimings, setFilteredTimings] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedTiming, setSelectedTiming] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
      fetchAppointments();
      fetchDoctors();
    }, []);

    const fetchAppointments = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/patient/${user.p_id}/appointments`, {
          headers: { role: 'patient' }
        });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };

    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/doctors/with-timings');
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
        const res = await fetch(`http://localhost:5000/api/doctors/${doctorId}/timings`);
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
      setAppointmentDate(dateValue);

      // Derive day-of-week from precomputed list to avoid timezone issues
      const dates = getAvailableDates();
      const match = dates.find(d => d.date === dateValue);
      const dayOfWeek = match ? match.day : null;

      const availableTimings = dayOfWeek
        ? doctorTimings.filter(timing => timing.day_of_week === dayOfWeek)
        : [];
      setFilteredTimings(availableTimings);

      // Reset timing and slot selection
      setSelectedTiming('');
      setSelectedSlot('');
      setSlots([]);
    };

    const handleDoctorChange = (doctorId) => {
      setSelectedDoctor(doctorId);
      setSelectedTiming('');
      setSelectedSlot('');
      setDoctorTimings([]);
      setFilteredTimings([]);
      setSlots([]);
      setAppointmentDate('');

      if (doctorId) {
        fetchDoctorTimings(doctorId);
      }
    };

    const handleTimingChange = (timingId) => {
      setSelectedTiming(timingId);
      setSelectedSlot('');
      setSlots([]);

      if (timingId) {
        fetchSlots(timingId);
      }
    };

    // Get available dates for the selected doctor (next 2 weeks)
    const getAvailableDates = () => {
      if (!doctorTimings.length) return [];

      const availableDates = [];
      const today = new Date();
      const nextTwoWeeks = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));

      // Get unique days from full doctor timings
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

    const handleCreateAppointment = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setSuccess('');

      if (!selectedDoctor || !selectedTiming || !selectedSlot || !appointmentDate) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      try {
        const appointmentData = {
          Patient_p_id: user.p_id,
          Doctor_d_id: selectedDoctor,
          timing_id: selectedTiming,
          appointment_mode: 'Self',
          slot_id: selectedSlot,
          ap_date: appointmentDate
        };

        const res = await fetch('http://localhost:5000/api/patient/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            role: 'patient'
          },
          body: JSON.stringify(appointmentData)
        });

        if (res.ok) {
          setSuccess('✅ Appointment created successfully!');
          setShowAppointmentForm(false);
          setSelectedDoctor('');
          setSelectedTiming('');
          setSelectedSlot('');
          setAppointmentDate('');
          setDoctorTimings([]);
          setFilteredTimings([]);
          setSlots([]);
          fetchAppointments();
        } else {
          const errorData = await res.json();
          setError(`❌ Error: ${errorData.error}`);
        }
      } catch (err) {
        console.error('Error creating appointment:', err);
        setError('❌ Error creating appointment');
      } finally {
        setLoading(false);
      }
    };

    const viewPrescription = async (appointmentId) => {
      try {
        const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, {
          headers: { role: 'patient' }
        });

        if (res.ok) {
          const prescriptionData = await res.json();
          if (prescriptionData.length > 0) {
            const prescription = prescriptionData[0];
            alert(`Prescription Details:\nDiagnosis: ${prescription.diagnosis}\nFollow-up Required: ${prescription.follow_up_required ? 'Yes' : 'No'}\nNotes: ${prescription.notes || 'None'}`);
          } else {
            alert('No prescription found for this appointment');
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

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
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

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Patient Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name} (Blood Group: {user.blood_group})</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAppointmentForm(!showAppointmentForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showAppointmentForm ? 'Cancel' : 'Create Appointment'}
            </button>
            <button
              onClick={fetchAppointments}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Create Appointment Form */}
        {showAppointmentForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Appointment</h2>
            <form onSubmit={handleCreateAppointment} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor *</label>
                <select
                  required
                  value={selectedDoctor}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <select
                  required
                  value={appointmentDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={!selectedDoctor || doctorTimings.length === 0}
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
                <label className="block text-sm font-medium text-gray-700">Timing *</label>
                <select
                  required
                  value={selectedTiming}
                  onChange={(e) => handleTimingChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={!appointmentDate || filteredTimings.length === 0}
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
                <label className="block text-sm font-medium text-gray-700">Slot *</label>
                <select
                  required
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={!selectedTiming}
                >
                  <option value="">Select Slot</option>
                  {slots.map(slot => (
                    <option
                      key={slot.slot_id}
                      value={slot.slot_id}
                      disabled={slot.is_booked}
                    >
                      {slot.slot_start} - {slot.slot_end} {slot.is_booked ? '(Booked)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">My Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map(appointment => (
                  <tr key={appointment.ap_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.ap_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.d_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.dept_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(appointment.ap_date)}<br />
                      {appointment.slot_start} - {appointment.slot_end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {appointment.status === 'Completed' && (
                        <button
                          onClick={() => viewPrescription(appointment.ap_id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Prescription
                        </button>
                      )}
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
