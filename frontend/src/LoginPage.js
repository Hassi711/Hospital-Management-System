import React, { useState } from 'react';
import './App.css';

export default function LoginPage({ onLogin }) {
  const [isRegistration, setIsRegistration] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Patient registration fields
  const [patientData, setPatientData] = useState({
    p_name: '',
    phone_no: '',
    CNIC: '',
    gender: '',
    Blood_Group: '',
    Relative_name: '',
    email: '',
    security_question: '',
    security_answer: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegistration) {
      // Handle patient registration
      try {
        const res = await fetch('http://localhost:5000/api/patient/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...patientData,
            username,
            password
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setSuccess('Registration successful! You can now login.');
          setIsRegistration(false);
          setUsername('');
          setPassword('');
          setPatientData({
            p_name: '',
            phone_no: '',
            CNIC: '',
            gender: '',
            Blood_Group: '',
            Relative_name: '',
            email: '',
            security_question: '',
            security_answer: ''
          });
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Registration failed');
        }
      } catch (err) {
        setError('Server error during registration');
      }
    } else {
      // Handle login
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Invalid username or password');
        return;
      }
      const data = await res.json();
        onLogin(data);
    } catch (err) {
      setError('Server error');
    }
    }
  };

  const handlePatientDataChange = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '20px' }}>
        <h2 className="page-title text-center" style={{ fontSize: '28px', marginBottom: '32px' }}>
          {isRegistration ? 'Patient Registration' : 'Hospital Login'}
        </h2>
        
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => setIsRegistration(false)}
            className={`nav-button ${!isRegistration ? 'active' : ''}`}
            style={{ flex: 1 }}
          >
            Login
          </button>
          <button 
            onClick={() => setIsRegistration(true)}
            className={`nav-button ${isRegistration ? 'active' : ''}`}
            style={{ flex: 1 }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>
              {isRegistration ? 'Email' : 'Username'}
            </label>
            <input
              className="input"
              type={isRegistration ? 'email' : 'text'}
              placeholder={isRegistration ? 'Enter your email' : 'Enter username'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistration && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your full name"
                  value={patientData.p_name}
                  onChange={e => handlePatientDataChange('p_name', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="Enter phone number"
                  value={patientData.phone_no}
                  onChange={e => handlePatientDataChange('phone_no', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>CNIC</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter CNIC"
                  value={patientData.CNIC}
                  onChange={e => handlePatientDataChange('CNIC', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Gender</label>
                <select
                  className="select"
                  value={patientData.gender}
                  onChange={e => handlePatientDataChange('gender', e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-group">
                <label>Blood Group</label>
                <select
                  className="select"
                  value={patientData.Blood_Group}
                  onChange={e => handlePatientDataChange('Blood_Group', e.target.value)}
                  required
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

              <div className="input-group">
                <label>Emergency Contact Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter emergency contact name"
                  value={patientData.Relative_name}
                  onChange={e => handlePatientDataChange('Relative_name', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Security Question</label>
                <select
                  className="select"
                  value={patientData.security_question}
                  onChange={e => handlePatientDataChange('security_question', e.target.value)}
                  required
                >
                  <option value="">Select Security Question</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="In which city were you born?">In which city were you born?</option>
                  <option value="What is your favorite color?">What is your favorite color?</option>
                </select>
              </div>

              <div className="input-group">
                <label>Security Answer</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your security answer"
                  value={patientData.security_answer}
                  onChange={e => handlePatientDataChange('security_answer', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-actions" style={{ borderTop: 'none', marginTop: '24px', paddingTop: 0 }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isRegistration ? 'Create Account' : 'Login'}
            </button>
          </div>
        </form>

        {error && <div className="error-message text-center">{error}</div>}
        {success && <div className="success-message text-center">{success}</div>}
      </div>
    </div>
  );
} 