import React, { useState, useEffect } from 'react';

export default function ReceptionistBillingPage({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [billData, setBillData] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [appointmentsWithBills, setAppointmentsWithBills] = useState(new Set());

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Add visibility change listener to refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing billing data...');
        fetchAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      console.log('Window gained focus, refreshing billing data...');
      fetchAppointments();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add route change listener to refresh data when navigating back
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('Route changed, refreshing billing data...');
      fetchAppointments();
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also refresh when component becomes visible after navigation
    const handleFocus = () => {
      console.log('Component focused after navigation, refreshing billing data...');
      fetchAppointments();
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
      console.log('Periodic refresh triggered for billing...');
      fetchAppointments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching fresh appointments from database for billing...');
      const res = await fetch('http://localhost:5000/api/receptionist/appointments', {
        headers: { 
          role: 'receptionist',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fresh billing appointments data:', data);
        setAppointments(data);
        
        // Check which appointments have bills
        const billsSet = new Set();
        for (const appointment of data) {
          try {
            const billRes = await fetch(`http://localhost:5000/api/appointments/${appointment.ap_id}/bill/view`, {
              headers: { 
                role: 'receptionist',
                'Cache-Control': 'no-cache'
              }
            });
            if (billRes.ok) {
              billsSet.add(appointment.ap_id);
            }
          } catch (err) {
            // Appointment doesn't have a bill
          }
        }
        setAppointmentsWithBills(billsSet);
      } else {
        console.error('Failed to fetch appointments for billing:', res.status);
      }
    } catch (err) {
      console.error('Error fetching appointments for billing:', err);
    }
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
    console.log('Manual refresh triggered for billing...');
    
    // Refresh all appointments
    await fetchAppointments();
    
    // Also refresh status for each appointment individually
    for (const appointment of appointments) {
      await refreshAppointmentStatus(appointment.ap_id);
    }
    
    alert('✅ Billing data refreshed successfully!');
  };

  const generateBill = async (appointmentId) => {
    try {
      console.log('Generating bill for appointment:', appointmentId);
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/bill`, {
        method: 'GET',
        headers: { 
          role: 'receptionist',
          receptionist_name: user.name || user.username
        }
      });
      
      if (res.ok) {
        const billData = await res.json();
        console.log('Bill generated successfully:', billData);
        
        // Add to appointmentsWithBills set
        setAppointmentsWithBills(prev => new Set([...prev, appointmentId]));
        
        // Fetch updated appointment status from database
        const statusRes = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
          headers: { 
            role: 'receptionist',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          console.log('Updated appointment status:', statusData);
          
          // Update the appointment status in the local state
          setAppointments(prevAppointments => 
            prevAppointments.map(appointment => 
              appointment.ap_id === appointmentId 
                ? { ...appointment, status: statusData.status }
                : appointment
            )
          );
        }
        
        // Show success message
        alert(`✅ Bill generated successfully!\n\nBill ID: ${billData.fee_id}\nPatient: ${billData.patient_name}\nDoctor: ${billData.doctor_name}\nTotal Amount: $${billData.total}\n\nAppointment status has been updated to "Completed".`);
        
        // Refresh appointments to get updated status
        await fetchAppointments();
        
      } else {
        const errorData = await res.json();
        console.error('Bill generation failed:', errorData.error);
        alert(`❌ Error generating bill: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      alert('Error generating bill. Please try again.');
    }
  };

  const printBill = () => {
    if (!billData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Bill</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .bill-details { margin-bottom: 20px; }
            .bill-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .bill-table th, .bill-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; }
            .medical-records { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
            .medical-records h4 { margin-top: 0; }
            .record-item { margin-bottom: 8px; font-size: 12px; }
            .disclaimer { 
              margin-top: 30px; 
              padding: 15px; 
              border: 2px solid #333; 
              background-color: #f9f9f9; 
              page-break-inside: avoid;
              font-size: 11px;
            }
            .disclaimer h3 { color: #d32f2f; margin-top: 0; font-size: 14px; }
            .disclaimer ul { margin: 8px 0; padding-left: 15px; }
            .disclaimer li { margin-bottom: 6px; }
            .legal-disclaimer { 
              margin-top: 15px; 
              padding: 12px; 
              border: 1px solid #666; 
              background-color: #fff; 
              page-break-inside: avoid;
            }
            .legal-disclaimer h4 { color: #d32f2f; margin-top: 0; font-size: 12px; }
            .legal-disclaimer p { margin: 5px 0; font-size: 10px; }
            .copyright { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
            @media print {
              .disclaimer { page-break-inside: avoid; }
              .legal-disclaimer { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${billData.hospital_name}</h1>
            <h2>Medical Bill</h2>
          </div>
          
          <div class="bill-details">
            <p><strong>Bill ID:</strong> ${billData.fee_id}</p>
            <p><strong>Date:</strong> ${new Date(billData.timestamp).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(billData.timestamp).toLocaleTimeString()}</p>
            <p><strong>Patient Name:</strong> ${billData.patient_name}</p>
            <p><strong>Blood Group:</strong> ${billData.blood_group}</p>
            <p><strong>Doctor:</strong> ${billData.doctor_name}</p>
            <p><strong>Generated by:</strong> ${billData.receptionist_name}</p>
          </div>
          
          ${billData.medical_records && billData.medical_records.length > 0 ? `
          <div class="medical-records">
            <h4>Past Medical Records</h4>
            ${billData.medical_records.map((record, index) => `
              <div class="record-item">
                <strong>Record ${index + 1}:</strong> ${record.diaganosis}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <table class="bill-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Doctor Consultation Fee</td>
                <td>$${billData.doctor_fee}</td>
              </tr>
              <tr>
                <td>Medicine Charges</td>
                <td>$${billData.medicine_total}</td>
              </tr>
            </tbody>
          </table>
          
          ${billData.medicines && billData.medicines.length > 0 ? `
          <div class="medicine-details" style="margin: 20px 0;">
            <h4>Medicine Details</h4>
            <table class="bill-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${billData.medicines.map(medicine => `
                  <tr>
                    <td>${medicine.m_name}</td>
                    <td>${medicine.quantity}</td>
                    <td>$${medicine.price}</td>
                    <td>$${medicine.total_price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="total">
            <p><strong>Total Amount:</strong> $${billData.total}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing ${billData.hospital_name}</p>
            <p>Generated on: ${new Date(billData.timestamp).toLocaleString()}</p>
          </div>
          
          <div class="disclaimer">
            <h3>🛡️ Patient Notice & Disclaimer</h3>
            <ul>
              <li>📅 Attend follow-up on time to avoid medical risks.</li>
              <li>💊 Use only prescribed medicines from licensed pharmacies.</li>
              <li>⚠️ Do not alter dosage or self-medicate.</li>
              <li>🧾 Bring this slip on future visits.</li>
              <li>🔒 Your data is kept confidential under health privacy laws.</li>
            </ul>
            
            <div class="legal-disclaimer">
              <h4>⚖️ Legal Disclaimer</h4>
              <p>This prescription is issued based on your current diagnosis.</p>
              <p>Any misuse, alteration, or false use is prohibited and may result in legal consequences.</p>
              <p>Doctor's Hospital 2025 is not liable for complications arising from non-compliance.</p>
            </div>
          </div>
          
          <div class="copyright">
            <p>© Doctor's Hospital 2025 – All Rights Reserved</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const markAsCompleted = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { role: 'receptionist' }
      });
      if (res.ok) {
        alert('✅ Appointment marked as completed successfully!');
        fetchAppointments();
        setBillData(null);
        setSelectedAppointment(null);
      } else {
        const errorData = await res.json();
        alert(`❌ Error marking as completed: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error marking as completed:', err);
      alert('❌ Error marking as completed');
    }
  };

  const viewPrescription = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, {
        headers: { role: 'receptionist' }
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptionData(data);
        setShowPrescription(true);
      }
    } catch (err) {
      console.error('Error fetching prescription:', err);
    }
  };

  const viewBill = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/bill/view`, {
        headers: { role: 'receptionist' }
      });
      if (res.ok) {
        const data = await res.json();
        setBillData(data);
        setSelectedAppointment(appointmentId);
      } else {
        const errorData = await res.json();
        console.error('Bill viewing failed:', errorData.error);
        alert(`Error viewing bill: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
      alert('Error fetching bill. Please try again.');
    }
  };

  const viewDetails = async (appointmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
        headers: { role: 'receptionist' }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointmentDetails(data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
    }
  };

  const debugAppointmentStatus = async (appointmentId) => {
    try {
      console.log('=== DEBUGGING APPOINTMENT STATUS ===');
      console.log('Appointment ID:', appointmentId);
      
      // Check current status in database
      const statusRes = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        headers: { 
          role: 'receptionist',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        console.log('Database status:', statusData);
        
        // Find appointment in local state
        const localAppointment = appointments.find(apt => apt.ap_id === appointmentId);
        console.log('Local state status:', localAppointment?.status);
        
        alert(`🔍 Status Debug for Appointment ${appointmentId}:\n\nDatabase Status: ${statusData.status}\nLocal State Status: ${localAppointment?.status || 'Not found'}\n\nIf they don't match, click the refresh button.`);
        
        return statusData.status;
      } else {
        console.error('Failed to get appointment status:', statusRes.status);
        alert('❌ Failed to get appointment status from database');
        return null;
      }
    } catch (err) {
      console.error('Error debugging appointment status:', err);
      alert('❌ Error debugging appointment status');
      return null;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Billing Management</h2>
        <button 
          onClick={handleRefresh}
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

      <h3>Appointments</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Patient</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Doctor</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Date</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appointment => (
            <tr key={appointment.ap_id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{appointment.ap_id}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tr>
                    <td style={{ padding: 0, border: 'none' }}>{appointment.p_name}</td>
                  </tr>
                </table>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tr>
                    <td style={{ padding: 0, border: 'none' }}>{appointment.d_name}</td>
                  </tr>
                </table>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tr>
                    <td style={{ padding: 0, border: 'none' }}>{new Date(appointment.ap_date).toLocaleDateString()}</td>
                  </tr>
                </table>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tr>
                    <td style={{ padding: 0, border: 'none' }}>
                      <span 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: 
                            appointment.status === 'Completed' ? '#28a745' : 
                            appointment.status === 'Cancelled' ? '#dc3545' : '#ffc107',
                          color: appointment.status === 'Completed' || appointment.status === 'Cancelled' ? 'white' : 'black'
                        }}
                        title={`Status: ${appointment.status || 'Scheduled'}`}
                      >
                        {appointment.status || 'Scheduled'}
                      </span>
                      <button 
                        onClick={() => refreshAppointmentStatus(appointment.ap_id)}
                        style={{ 
                          marginLeft: 5, 
                          padding: '2px 4px', 
                          backgroundColor: '#17a2b8', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 2,
                          fontSize: '10px'
                        }}
                        title="Refresh Status"
                      >
                        🔄
                      </button>
                      <button 
                        onClick={() => debugAppointmentStatus(appointment.ap_id)}
                        style={{ 
                          marginLeft: 2, 
                          padding: '2px 4px', 
                          backgroundColor: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: 2,
                          fontSize: '10px'
                        }}
                        title="Debug Status"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                </table>
              </td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  {appointmentsWithBills.has(appointment.ap_id) ? (
                    <>
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none' }}>
                          <button 
                            onClick={() => viewBill(appointment.ap_id)}
                            style={{ width: '100%', padding: 5, backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: 3 }}
                            title="View Bill"
                          >
                            View Bill
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none' }}>
                          <button 
                            onClick={() => viewPrescription(appointment.ap_id)}
                            style={{ width: '100%', padding: 5, backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: 3 }}
                            title="View Prescription"
                          >
                            View Prescription
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none' }}>
                          <button 
                            onClick={() => viewDetails(appointment.ap_id)}
                            style={{ width: '100%', padding: 5, backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 3 }}
                            title="View Details"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none' }}>
                          <button 
                            onClick={() => generateBill(appointment.ap_id)}
                            style={{ width: '100%', padding: 5, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 3 }}
                            title="Generate Bill"
                          >
                            Generate Bill
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 0', border: 'none' }}>
                          <button 
                            onClick={() => viewPrescription(appointment.ap_id)}
                            style={{ width: '100%', padding: 5, backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: 3 }}
                            title="View Prescription"
                          >
                            View Prescription
                          </button>
                        </td>
                      </tr>
                    </>
                  )}
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bill Display */}
      {billData && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: 20, 
          borderRadius: 8, 
          marginTop: 20,
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: 15 }}>Bill Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 20 }}>
            <div>
              <strong>Hospital:</strong> {billData.hospital_name}
            </div>
            <div>
              <strong>Bill ID:</strong> {billData.fee_id}
            </div>
            <div>
              <strong>Patient:</strong> {billData.patient_name}
            </div>
            <div>
              <strong>Blood Group:</strong> {billData.blood_group}
            </div>
            <div>
              <strong>Doctor:</strong> {billData.doctor_name}
            </div>
            <div>
              <strong>Receptionist:</strong> {billData.receptionist_name}
            </div>
            <div>
              <strong>Date:</strong> {new Date(billData.timestamp).toLocaleString()}
            </div>
            <div>
              <strong>Status:</strong> 
              <span style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: billData.status === 'Paid' ? '#27ae60' : '#f39c12',
                color: 'white',
                marginLeft: '8px'
              }}>
                {billData.status}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: '#2c3e50', marginBottom: 10 }}>Fee Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><strong>Doctor Fee:</strong> ${billData.doctor_fee}</div>
              <div><strong>Medicine Total:</strong> ${billData.medicine_total}</div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                <strong>Total Amount:</strong> ${billData.total}
              </div>
            </div>
          </div>

          {billData.medicines && billData.medicines.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: '#2c3e50', marginBottom: 10 }}>Medicines</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Medicine</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantity</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Price</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.medicines.map((medicine, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{medicine.m_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{medicine.quantity}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${medicine.price}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${medicine.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {billData.medical_records && billData.medical_records.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: '#2c3e50', marginBottom: 10 }}>Past Medical Records</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', backgroundColor: 'white' }}>
                {billData.medical_records.map((record, index) => (
                  <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
                    <strong>Record ID:</strong> {record.mr_id}<br />
                    <strong>Diagnosis:</strong> {record.diaganosis || 'No diagnosis recorded'}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={printBill}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Print Bill
            </button>
            
            {billData.status === 'Paid' && (
              <span style={{ 
                padding: '10px 20px', 
                backgroundColor: '#27ae60', 
                color: 'white', 
                borderRadius: '5px',
                fontWeight: 'bold'
              }}>
                ✓ Completed
              </span>
            )}
          </div>
        </div>
      )}

      {showPrescription && prescriptionData && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 5, 
            maxWidth: 600, 
            maxHeight: 400, 
            overflow: 'auto' 
          }}>
            <h3>Prescription Details</h3>
            {prescriptionData.length > 0 && (
              <>
                <p><strong>Diagnosis:</strong> {prescriptionData[0].diagnosis}</p>
                <p><strong>Follow-up Required:</strong> {prescriptionData[0].follow_up_required ? 'Yes' : 'No'}</p>
                {prescriptionData[0].follow_up_date && (
                  <p><strong>Follow-up Date:</strong> {new Date(prescriptionData[0].follow_up_date).toLocaleDateString()}</p>
                )}
                <p><strong>Notes:</strong> {prescriptionData[0].notes}</p>
                
                <h4>Medicines</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: 8 }}>Medicine</th>
                      <th style={{ border: '1px solid #ddd', padding: 8 }}>Price</th>
                      <th style={{ border: '1px solid #ddd', padding: 8 }}>Quantity</th>
                      <th style={{ border: '1px solid #ddd', padding: 8 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionData.filter(item => item.m_id).map((item, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.m_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>${item.price}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.quantity}</td>
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <button 
              onClick={() => setShowPrescription(false)}
              style={{ marginTop: 10, padding: 10, backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 5 }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDetails && appointmentDetails && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 5, 
            maxWidth: 600, 
            maxHeight: 400, 
            overflow: 'auto' 
          }}>
            <h3>Appointment Details</h3>
            <p><strong>Appointment ID:</strong> {appointmentDetails.ap_id}</p>
            <p><strong>Patient Name:</strong> {appointmentDetails.p_name}</p>
            <p><strong>Blood Group:</strong> {appointmentDetails.Blood_Group}</p>
            <p><strong>Doctor:</strong> {appointmentDetails.d_name}</p>
            <p><strong>Department:</strong> {appointmentDetails.dept_name}</p>
            <p><strong>Date:</strong> {new Date(appointmentDetails.ap_date).toLocaleDateString()}</p>
            <p><strong>Day:</strong> {appointmentDetails.day_of_week}</p>
            <p><strong>Time:</strong> {appointmentDetails.start_time} - {appointmentDetails.end_time}</p>
            <p><strong>Slot:</strong> {appointmentDetails.slot_start} - {appointmentDetails.slot_end}</p>
            <p><strong>Mode:</strong> {appointmentDetails.appointment_mode}</p>
            <p><strong>Status:</strong> {appointmentDetails.status || 'Scheduled'}</p>
            <p><strong>Created:</strong> {new Date(appointmentDetails.app_created_on).toLocaleString()}</p>
            
            {appointmentDetails.prescription && (
              <div style={{ marginTop: 15, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 5 }}>
                <h4>Prescription Information</h4>
                <p><strong>Diagnosis:</strong> {appointmentDetails.prescription.diagnosis}</p>
                <p><strong>Follow-up Required:</strong> {appointmentDetails.prescription.follow_up_required ? 'Yes' : 'No'}</p>
                {appointmentDetails.prescription.follow_up_date && (
                  <p><strong>Follow-up Date:</strong> {new Date(appointmentDetails.prescription.follow_up_date).toLocaleDateString()}</p>
                )}
                <p><strong>Notes:</strong> {appointmentDetails.prescription.notes}</p>
              </div>
            )}
            
            {appointmentDetails.fee && (
              <div style={{ marginTop: 15, padding: 10, backgroundColor: '#e9ecef', borderRadius: 5 }}>
                <h4>Billing Information</h4>
                <p><strong>Bill ID:</strong> {appointmentDetails.fee.fee_id}</p>
                <p><strong>Amount:</strong> ${appointmentDetails.fee.amount}</p>
                <p><strong>Status:</strong> {appointmentDetails.fee.status}</p>
                {appointmentDetails.fee.date_paid && (
                  <p><strong>Paid Date:</strong> {new Date(appointmentDetails.fee.date_paid).toLocaleString()}</p>
                )}
              </div>
            )}
            <button 
              onClick={() => setShowDetails(false)}
              style={{ marginTop: 10, padding: 10, backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 5 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
