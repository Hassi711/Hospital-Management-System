import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './LoginPage';
import ReceptionistAppointmentPage from './ReceptionistAppointmentPage';
import ReceptionistBillingPage from './ReceptionistBillingPage';
import DoctorDashboardPage from './DoctorDashboardPage';
import AdminDashboardPage from './AdminDashboardPage';
import ReceptionistAdmissionPage from './ReceptionistAdmissionPage';
import PatientDashboard from './PatientDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('appointments');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update current date/time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatShiftTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Not Assigned';
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <h2>Hospital Management System</h2>
          <div className="sub-info">
            <span>
              <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)} | 
              <strong> User:</strong> {user.name}
            </span>
            {user.shift_type && (
              <span>
                <strong>Shift:</strong> {user.shift_type} ({formatShiftTime(user.start_time, user.end_time)})
              </span>
            )}
          </div>
        </div>
        <div className="datetime-info">
          <div>
            <strong>Date:</strong> {currentDateTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div>
            <strong>Time:</strong> {currentDateTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: true 
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-bar">
        {user.role === 'receptionist' && (
          <>
            <button 
              onClick={() => setCurrentPage('appointments')}
              className={`nav-button ${currentPage === 'appointments' ? 'active' : ''}`}
            >
              Appointments
            </button>
            <button 
              onClick={() => setCurrentPage('billing')}
              className={`nav-button ${currentPage === 'billing' ? 'active' : ''}`}
            >
              Billing
            </button>
            <button 
              onClick={() => setCurrentPage('admission')}
              className={`nav-button ${currentPage === 'admission' ? 'active' : ''}`}
            >
              Admission
            </button>
          </>
        )}
        {user.role === 'doctor' && (
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="nav-button active"
          >
            Doctor Dashboard
          </button>
        )}
        {user.role === 'patient' && (
          <button 
            onClick={() => setCurrentPage('patient')}
            className="nav-button active"
          >
            Patient Dashboard
          </button>
        )}
        {user.role === 'admin' && (
          <button 
            onClick={() => setCurrentPage('admin')}
            className={`nav-button ${currentPage === 'admin' ? 'active' : ''}`}
          >
            Admin
          </button>
        )}
        <button 
          onClick={() => setUser(null)}
          className="nav-button logout-button"
        >
          Logout
        </button>
      </div>

      {/* Page Content */}
      <div className="page-content">
        {user.role === 'receptionist' && currentPage === 'appointments' && (
          <ReceptionistAppointmentPage user={user} setCurrentPage={setCurrentPage} />
        )}
        {user.role === 'receptionist' && currentPage === 'billing' && (
          <ReceptionistBillingPage user={user} />
        )}
        {user.role === 'receptionist' && currentPage === 'admission' && (
          <ReceptionistAdmissionPage user={user} />
        )}
        {user.role === 'doctor' && (
          <DoctorDashboardPage user={user} />
        )}
        {user.role === 'patient' && (
          <PatientDashboard user={user} />
        )}
        {user.role === 'admin' && currentPage === 'admin' && (
          <AdminDashboardPage user={user} />
        )}
      </div>
    </div>
  );
}
