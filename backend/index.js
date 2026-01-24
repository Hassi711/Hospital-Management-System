require('dotenv').config();
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_management',
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');


  // Ensure supplemental tables exist
  const createAdmissionMedicine = `
    CREATE TABLE IF NOT EXISTS admission_medicine (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admission_id INT NOT NULL,
      m_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      administered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_admission_medicine_adm FOREIGN KEY (admission_id) REFERENCES admission(admission_id) ON DELETE CASCADE,
      CONSTRAINT fk_admission_medicine_med FOREIGN KEY (m_id) REFERENCES medicine(m_id)
    ) ENGINE=InnoDB
  `;
  db.query(createAdmissionMedicine, (err2) => {
    if (err2) {
      console.warn('Could not ensure table admission_medicine exists:', err2.message);
    } else {
      console.log('admission_medicine table is ready');
    }
  });
});

// Sample API: Get all patients (excluding those with completed/scheduled appointments)
app.get('/api/patients', (req, res) => {
  const sql = `
    SELECT p.*, w.ward_name, w.dept_id AS department_id, d.dept_name AS department_name
    FROM patient p
    LEFT JOIN ward w ON p.ward_id = w.ward_id
    LEFT JOIN department d ON w.dept_id = d.dept_id
    WHERE p.p_id NOT IN (
      SELECT DISTINCT ap.Patient_p_id 
      FROM appointment ap 
      WHERE ap.status IN ('Completed', 'Scheduled')
    )
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// Sample API: Get all shifts
app.get('/api/admin/shifts', (req, res) => {
  console.log('HIT /api/admin/shifts');
 
  db.query(`SELECT * FROM shift`, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});




// Sample API: Add a patient
app.post('/api/patients', (req, res) => {
  const patient = req.body;
  if (patient.ward_id) {
    db.query('SELECT capacity FROM ward WHERE ward_id = ?', [patient.ward_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length || results[0].capacity <= 0) {
        return res.status(400).json({ error: 'Ward is full or does not exist.' });
      }
      db.query('INSERT INTO patient SET ?', patient, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE ward SET capacity = capacity - 1 WHERE ward_id = ?', [patient.ward_id]);
        res.json({ id: result.insertId, ...patient });
      });
    });
  } else {
    db.query('INSERT INTO patient SET ?', patient, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, ...patient });
    });
  }
});

// Sample API: Delete a patient
app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT ward_id FROM patient WHERE p_id = ?', [id], (err, results) => {
    if (!err && results.length > 0 && results[0].ward_id) {
      db.query('UPDATE ward SET capacity = capacity + 1 WHERE ward_id = ?', [results[0].ward_id]);
    }
    db.query('DELETE FROM patient WHERE p_id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Sample API: Update a patient
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const patient = req.body;
  db.query('UPDATE patient SET ? WHERE p_id = ?', [patient, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// COUNTRY CRUD ENDPOINTS
app.get('/api/countries', (req, res) => {
  db.query('SELECT * FROM country', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/countries', (req, res) => {
  const { country_id, name } = req.body;
  db.query('INSERT INTO country (country_id, name) VALUES (?, ?)', [country_id, name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ country_id, name });
  });
});

app.put('/api/countries/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.query('UPDATE country SET name = ? WHERE country_id = ?', [name, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ country_id: id, name });
  });
});

app.delete('/api/countries/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM country WHERE country_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// BLOOD GROUP CRUD ENDPOINTS
app.get('/api/blood_groups', (req, res) => {
  db.query('SELECT * FROM blood_group', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/blood_groups', (req, res) => {
  const { id, type } = req.body;
  db.query('INSERT INTO blood_group (id, type) VALUES (?, ?)', [id, type], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, type });
  });
});

app.put('/api/blood_groups/:id', (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  db.query('UPDATE blood_group SET type = ? WHERE id = ?', [type, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, type });
  });
});

app.delete('/api/blood_groups/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM blood_group WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DEPARTMENT CRUD ENDPOINTS
app.get('/api/departments', (req, res) => {
  db.query('SELECT dept_id AS department_id, dept_name AS department_name, budget FROM department', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/departments', (req, res) => {
  const { dept_id, dept_name, budget } = req.body;
  db.query('INSERT INTO department (dept_id, dept_name, budget) VALUES (?, ?, ?)', [dept_id, dept_name, budget], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ dept_id, dept_name, budget });
  });
});

app.put('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  const { dept_name, budget } = req.body;
  db.query('UPDATE department SET dept_name = ?, budget = ? WHERE dept_id = ?', [dept_name, budget, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ dept_id: id, dept_name, budget });
  });
});

app.delete('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM department WHERE dept_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// WARD CRUD ENDPOINTS
app.get('/api/wards', (req, res) => {
  const { departmentId } = req.query;
  let sql = `
    SELECT w.ward_id, w.ward_name, w.capacity, w.dept_id AS department_id, d.dept_name AS department_name
    FROM ward w
    LEFT JOIN department d ON w.dept_id = d.dept_id
  `;
  let params = [];
  if (departmentId) {
    sql += ' WHERE w.dept_id = ?';
    params.push(departmentId);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/wards', (req, res) => {
  const { ward_id, ward_name, capacity, department_id } = req.body;
  db.query('INSERT INTO ward (ward_id, ward_name, capacity, dept_id) VALUES (?, ?, ?, ?)', [ward_id, ward_name, capacity, department_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ward_id, ward_name, capacity, department_id });
  });
});

app.put('/api/wards/:id', (req, res) => {
  const { id } = req.params;
  const { ward_name, capacity, department_id } = req.body;
  db.query('UPDATE ward SET ward_name = ?, capacity = ?, dept_id = ? WHERE ward_id = ?', [ward_name, capacity, department_id, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ward_id: id, ward_name, capacity, department_id });
  });
});

app.delete('/api/wards/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM ward WHERE ward_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 1. Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // First try to find in userlogin table
  const sql = `
    SELECT u.username, u.password, u.staff_id, u.p_id,
           s.s_name, s.CNIC, s.ph_number, s.Gender, s.join_date, 
           r.r_name, r.r_id, sh.shift_type, sh.start_time, sh.end_time,
           p.p_name as patient_name, p.Blood_Group as patient_blood_group
    FROM userlogin u
    LEFT JOIN staff s ON u.staff_id = s.s_id
    LEFT JOIN role r ON s.Roll_r_id = r.r_id
    LEFT JOIN shift sh ON s.Shift_shift_id = sh.shift_id
    LEFT JOIN patient p ON u.p_id = p.p_id
    WHERE u.username = ? AND u.password = ?
  `;

  db.query(sql, [username, password], (err, userRows) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Database error during login' });
    }

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRows[0];

    if (user.staff_id) {
      // Staff login
      const staffUser = {
        staff_id: user.staff_id,
        username: username,
        name: user.s_name,
        role: user.r_name ? user.r_name.toLowerCase() : 'staff',
        shift_type: user.shift_type || 'Not Assigned',
        start_time: user.start_time || null,
        end_time: user.end_time || null
      };

      console.log('Staff logged in:', staffUser);
      res.json(staffUser);
    } else if (user.p_id) {
      // Patient login
      const patientUser = {
        p_id: user.p_id,
        username: username,
        name: user.patient_name,
        role: 'patient',
        blood_group: user.patient_blood_group
      };

      console.log('Patient logged in:', patientUser);
      res.json(patientUser);
    } else {
      return res.status(401).json({ error: 'Invalid user type' });
    }
  });
});

// STAFF ADD ENDPOINT
app.post('/api/staff', (req, res) => {
  const staff = req.body;
  db.query('INSERT INTO staff SET ?', staff, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...staff });
  });
});

// GET ALL STAFF
app.get('/api/staff', (req, res) => {
  db.query('SELECT * FROM staff', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL ADMINS
app.get('/api/admins', (req, res) => {
  db.query('SELECT * FROM admin', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL DOCTORS
app.get('/api/doctors', (req, res) => {
  db.query('SELECT * FROM doctor', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL SURGEONS
app.get('/api/surgeons', (req, res) => {
  db.query('SELECT * FROM surgeon', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL RECEPTIONISTS
app.get('/api/receptionists', (req, res) => {
  db.query('SELECT * FROM receptionist', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL NURSES
app.get('/api/nurses', (req, res) => {
  db.query('SELECT * FROM nurse', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL INTERNS
app.get('/api/interns', (req, res) => {
  db.query('SELECT * FROM intern', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// GET ALL PATIENTS
app.get('/api/patients', (req, res) => {
  db.query('SELECT * FROM patient', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/test', (req, res) => {
  res.send('Backend is working!');
});

app.get('/test-blood', (req, res) => {
  db.query('SELECT * FROM blood_group', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
  res.send('Test blood route is working!');
});

app.get('/test-department', (req, res) => {
  db.query('SELECT * FROM department', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/departments_with_wards', (req, res) => {
  db.query(
    'SELECT d.dept_id, d.dept_name, w.ward_id, w.ward_name, w.capacity FROM department d LEFT JOIN ward w ON d.dept_id = w.dept_id',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      // Group by department
      const grouped = {};
      results.forEach(row => {
        if (!grouped[row.dept_id]) {
          grouped[row.dept_id] = {
            dept_id: row.dept_id,
            dept_name: row.dept_name,
            wards: [],
          };
        }
        if (row.ward_id) {
          grouped[row.dept_id].wards.push({
            ward_id: row.ward_id,
            ward_name: row.ward_name,
            capacity: row.capacity,
          });
        }
      });
      res.json(Object.values(grouped));
    }
  );
});

// GET CLINICAL TIMINGS
app.get('/api/clinical_timings', (req, res) => {
  db.query('SELECT * FROM clinical_timings', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET APPOINTMENT SLOTS
app.get('/api/slots', (req, res) => {
  const { timing_id } = req.query;
  let sql = 'SELECT * FROM appointment_slots';
  let params = [];
  if (timing_id) {
    sql += ' WHERE timing_id = ?';
    params.push(timing_id);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// --- Receptionist Module Endpoints ---

// Middleware to check if user is receptionist (r_id = 6)
function isReceptionist(req, res, next) {
  // For demo: assume role is sent in header (in production, use session/JWT)
  if (req.headers.role && req.headers.role.toString() === 'receptionist') return next();
  return res.status(403).json({ error: 'Forbidden: Receptionist access only' });
}

// 1. Create Appointment
app.post('/api/appointments', isReceptionist, (req, res) => {
  const { Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, ap_date } = req.body;
  if (!Patient_p_id || !Doctor_d_id || !timing_id || !appointment_mode || !slot_id || !ap_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const sql = `INSERT INTO appointment (ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, status) VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`;
  db.query(sql, [ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    // Mark slot as booked
    db.query('UPDATE appointment_slots SET is_booked = 1 WHERE slot_id = ?', [slot_id]);
    res.json({ ap_id: result.insertId });
  });
});

// 2. Fetch all appointments (with details)
app.get('/api/receptionist/appointments', isReceptionist, (req, res) => {
  console.log('=== FETCHING RECEPTIONIST APPOINTMENTS ===');
  console.log('Headers:', req.headers);

  const sql = 'SELECT * FROM receptionist_appointment_view ORDER BY ap_date DESC';
  console.log('SQL Query:', sql);

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('Appointments fetched from database:', results.length);
    console.log('Sample appointment data:', results[0]);

    res.json(results);
  });
});

// 3. Mark appointment as completed (when bill is generated)
app.put('/api/appointments/:id/status', isReceptionist, (req, res) => {
  const { id } = req.params;

  // First get prescription details to create medical record
  const prescriptionSql = `
    SELECT pr.diagnosis, pr.notes, p.p_id
    FROM prescription pr
    JOIN appointment ap ON pr.ap_id = ap.ap_id
    JOIN patient p ON ap.Patient_p_id = p.p_id
    WHERE pr.ap_id = ?
  `;

  db.query(prescriptionSql, [id], (err, prescriptionRows) => {
    if (err) {
      console.error('Error getting prescription:', err);
      return res.status(500).json({ error: 'Error getting prescription: ' + err.message });
    }

    if (prescriptionRows.length > 0) {
      // Create medical record
      const medicalRecordData = {
        Patient_p_id: prescriptionRows[0].p_id,
        diaganosis: prescriptionRows[0].diagnosis
      };

      db.query('INSERT INTO medical_record SET ?', medicalRecordData, (err2) => {
        if (err2) {
          console.error('Error creating medical record:', err2);
          // Continue with status update even if medical record fails
        }

        // Update appointment status
        db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Completed', id], (err3) => {
          if (err3) {
            console.error('Error updating appointment status:', err3);
            return res.status(500).json({ error: 'Error updating appointment status: ' + err3.message });
          }

          console.log('Appointment marked as completed and medical record created');
          res.json({ message: 'Appointment completed successfully' });
        });
      });
    } else {
      // No prescription found, just update status
      db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Completed', id], (err3) => {
        if (err3) {
          console.error('Error updating appointment status:', err3);
          return res.status(500).json({ error: 'Error updating appointment status: ' + err3.message });
        }

        console.log('Appointment marked as completed');
        res.json({ message: 'Appointment completed successfully' });
      });
    }
  });
});

// 4. Generate final bill (doctor + medicine)
app.get('/api/appointments/:id/bill', isReceptionist, (req, res) => {
  const { id } = req.params;
  const receptionistName = req.headers.receptionist_name || 'Receptionist';
  console.log('=== BILL GENERATION DEBUG ===');
  console.log('Generating bill for appointment ID:', id);
  console.log('Receptionist name:', receptionistName);

  // First check if appointment is already completed
  db.query('SELECT status FROM appointment WHERE ap_id = ?', [id], (err, statusRows) => {
    if (err) {
      console.error('Error checking appointment status:', err);
      return res.status(500).json({ error: 'Error checking appointment status: ' + err.message });
    }

    console.log('Status check result:', statusRows);

    if (!statusRows.length) {
      console.error('Appointment not found:', id);
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('Appointment status:', statusRows[0].status);

    if (statusRows[0].status === 'Completed') {
      console.log('Appointment already completed, cannot generate bill');
      return res.status(400).json({ error: 'Cannot generate bill for completed appointment. Bill already exists.' });
    }

    // Check if bill already exists for this appointment
    db.query('SELECT fee_id FROM fee WHERE ap_id = ?', [id], (err, billRows) => {
      if (err) {
        console.error('Error checking existing bill:', err);
        return res.status(500).json({ error: 'Error checking existing bill: ' + err.message });
      }

      if (billRows.length > 0) {
        console.log('Bill already exists for appointment:', id);
        return res.status(400).json({ error: 'Bill already exists for this appointment. Cannot generate duplicate bill.' });
      }

      // Check if appointment exists in the view (has prescription)
      db.query('SELECT COUNT(*) as count FROM receptionist_appointment_view WHERE ap_id = ?', [id], (err2, viewRows) => {
        if (err2) {
          console.error('Error checking appointment in view:', err2);
          return res.status(500).json({ error: 'Error checking appointment in view: ' + err2.message });
        }

        console.log('View check result:', viewRows);

        if (viewRows[0].count === 0) {
          console.error('Appointment not found in view:', id);
          // Let's check if there's a prescription for this appointment
          db.query('SELECT COUNT(*) as prescription_count FROM prescription WHERE ap_id = ?', [id], (err3, prescriptionRows) => {
            console.log('Prescription check result:', prescriptionRows);

            if (prescriptionRows[0].prescription_count === 0) {
              console.log('No prescription found for appointment, generating bill with doctor fee only');
              // Generate bill with doctor fee only (no prescription required)
              generateBillWithoutPrescription(id, receptionistName, res);
            } else {
              return res.status(404).json({ error: 'Appointment not found or no prescription available' });
            }
          });
          return;
        }

        // Get doctor fee (base or followup) from doctor_fee table
        const doctorFeeSql = `
          SELECT d.d_id, d.d_name, df.base_fee, df.followup_fee, v.is_follow_up,
                 p.p_name, p.Blood_Group, p.p_id
          FROM appointment ap
          JOIN doctor d ON ap.Doctor_d_id = d.d_id
          JOIN doctor_fee df ON d.d_id = df.d_id
          JOIN receptionist_appointment_view v ON ap.ap_id = v.ap_id
          JOIN patient p ON ap.Patient_p_id = p.p_id
          WHERE ap.ap_id = ?
        `;
        console.log('Doctor fee SQL:', doctorFeeSql);

        db.query(doctorFeeSql, [id], (err, feeRows) => {
          if (err) {
            console.error('Error getting doctor fee:', err);
            return res.status(500).json({ error: 'Error getting doctor fee: ' + err.message });
          }

          if (!feeRows.length) {
            console.error('No doctor fee found for appointment:', id);
            return res.status(404).json({ error: 'Doctor fee not found' });
          }

          console.log('Doctor fee data:', feeRows[0]);

          const doctorFee = feeRows[0].is_follow_up === 'Yes' ? feeRows[0].followup_fee : feeRows[0].base_fee;
          console.log('Selected doctor fee:', doctorFee);

          // Get medicine bill
          const medicineSql = `
            SELECT m.m_name, m.price, mb.quantity, m.usage_of_mediciene
            FROM mediciene_bill mb
            JOIN medicine m ON mb.m_id = m.m_id
            JOIN prescription p ON mb.prescription_id = p.prescription_id
            WHERE p.ap_id = ?
          `;

          db.query(medicineSql, [id], (err, medicineRows) => {
            if (err) {
              console.error('Error getting medicine bill:', err);
              return res.status(500).json({ error: 'Error getting medicine bill: ' + err.message });
            }

            console.log('Medicine data:', medicineRows);

            let totalAmount = parseFloat(doctorFee);
            const medicines = [];

            medicineRows.forEach(med => {
              const medicineTotal = parseFloat(med.price) * parseInt(med.quantity);
              totalAmount += medicineTotal;
              medicines.push({
                name: med.m_name,
                price: parseFloat(med.price),
                quantity: parseInt(med.quantity),
                total: medicineTotal,
                usage: med.usage_of_mediciene
              });
            });

            console.log('Total amount calculated:', totalAmount);

            // Insert bill into fee table
            const billData = {
              ap_id: id,
              amount: totalAmount,
              status: 'Paid',
              date_paid: new Date()
            };

            db.query('INSERT INTO fee SET ?', billData, (err3, result) => {
              if (err3) {
                console.error('Error inserting bill:', err3);
                return res.status(500).json({ error: 'Error inserting bill: ' + err3.message });
              }

              const feeId = result.insertId;
              console.log('Bill inserted with fee_id:', feeId);

              // UPDATE APPOINTMENT STATUS TO COMPLETED
              db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Completed', id], (err4) => {
                if (err4) {
                  console.error('Error updating appointment status:', err4);
                  return res.status(500).json({ error: 'Error updating appointment status: ' + err4.message });
                }

                console.log('Appointment status updated to Completed');

                const billResponse = {
                  fee_id: feeId,
                  appointment_id: id,
                  patient_name: feeRows[0].p_name,
                  doctor_name: feeRows[0].d_name,
                  doctor_fee: parseFloat(doctorFee),
                  medicines: medicines,
                  total: totalAmount,
                  status: 'Paid',
                  generated_by: receptionistName,
                  generated_at: new Date().toISOString()
                };

                console.log('Bill generation completed successfully');
                res.json(billResponse);
              });
            });
          });
        });
      });
    });
  });
});

// 5. Fetch prescription and medicine info for an appointment
app.get('/api/appointments/:id/prescription', isReceptionist, (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT pr.*, m.m_id, m.m_name, m.price, mb.quantity
    FROM prescription pr
    LEFT JOIN mediciene_bill mb ON pr.prescription_id = mb.prescription_id
    LEFT JOIN medicine m ON mb.m_id = m.m_id
    WHERE pr.ap_id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Middleware to check if user is doctor (r_id = 2 or role === 'doctor')
function isDoctor(req, res, next) {
  if (req.headers.role && req.headers.role.toString() === 'doctor') return next();
  return res.status(403).json({ error: 'Forbidden: Doctor access only' });
}

// 1. Fetch appointments for a specific doctor
app.get('/api/doctor/:staff_id/appointments', isDoctor, (req, res) => {
  const { staff_id } = req.params;
  const { filter = 'all' } = req.query;

  console.log('Doctor appointments request:', { staff_id, filter });

  // Get doctor ID from staff ID
  db.query('SELECT d_id FROM doctor WHERE Staff_s_id = ?', [staff_id], (err, doctorRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doctorRows.length) return res.status(404).json({ error: 'Doctor not found' });

    const d_id = doctorRows[0].d_id;
    console.log('Found doctor ID:', d_id);

    let sql, params = [d_id];

    switch (filter) {
      case 'today':
        sql = `SELECT DISTINCT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
                      p.p_name, p.phone_no, p.gender, p.Blood_Group,
                      d.d_name, dept.dept_name,
                      ct.day_of_week, ct.start_time, ct.end_time,
                      s.slot_start, s.slot_end,
                      CASE WHEN pr.follow_up_required = 1 AND pr.follow_up_date >= ap.ap_date THEN 'Yes' ELSE 'No' END AS is_follow_up
               FROM appointment ap
               JOIN patient p ON ap.Patient_p_id = p.p_id
               JOIN doctor d ON ap.Doctor_d_id = d.d_id
               JOIN department dept ON d.Department_dept_id = dept.dept_id
               JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
               JOIN appointment_slots s ON ap.slot_id = s.slot_id
               LEFT JOIN prescription pr ON pr.ap_id = ap.ap_id
               WHERE ap.Doctor_d_id = ? AND DATE(ap.ap_date) = CURDATE() 
               AND (ap.status IS NULL OR ap.status != 'Completed')
               ORDER BY ap.ap_date`;
        break;
      case 'next_day':
        sql = `SELECT DISTINCT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
                      p.p_name, p.phone_no, p.gender, p.Blood_Group,
                      d.d_name, dept.dept_name,
                      ct.day_of_week, ct.start_time, ct.end_time,
                      s.slot_start, s.slot_end,
                      CASE WHEN pr.follow_up_required = 1 AND pr.follow_up_date >= ap.ap_date THEN 'Yes' ELSE 'No' END AS is_follow_up
               FROM appointment ap
               JOIN patient p ON ap.Patient_p_id = p.p_id
               JOIN doctor d ON ap.Doctor_d_id = d.d_id
               JOIN department dept ON d.Department_dept_id = dept.dept_id
               JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
               JOIN appointment_slots s ON ap.slot_id = s.slot_id
               LEFT JOIN prescription pr ON pr.ap_id = ap.ap_id
               WHERE ap.Doctor_d_id = ? AND DATE(ap.ap_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
               AND (ap.status IS NULL OR ap.status != 'Completed')
               ORDER BY ap.ap_date`;
        break;
      case 'week':
        sql = `SELECT DISTINCT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
                      p.p_name, p.phone_no, p.gender, p.Blood_Group,
                      d.d_name, dept.dept_name,
                      ct.day_of_week, ct.start_time, ct.end_time,
                      s.slot_start, s.slot_end,
                      CASE WHEN pr.follow_up_required = 1 AND pr.follow_up_date >= ap.ap_date THEN 'Yes' ELSE 'No' END AS is_follow_up
               FROM appointment ap
               JOIN patient p ON ap.Patient_p_id = p.p_id
               JOIN doctor d ON ap.Doctor_d_id = d.d_id
               JOIN department dept ON d.Department_dept_id = dept.dept_id
               JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
               JOIN appointment_slots s ON ap.slot_id = s.slot_id
               LEFT JOIN prescription pr ON pr.ap_id = ap.ap_id
               WHERE ap.Doctor_d_id = ? AND YEARWEEK(ap.ap_date, 1) = YEARWEEK(CURDATE(), 1) 
               AND (ap.status IS NULL OR ap.status != 'Completed')
               ORDER BY ap.ap_date`;
        break;
      default: // all - show all appointments (not just today)
        sql = `SELECT DISTINCT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
                      p.p_name, p.phone_no, p.gender, p.Blood_Group,
                      d.d_name, dept.dept_name,
                      ct.day_of_week, ct.start_time, ct.end_time,
                      s.slot_start, s.slot_end,
                      CASE WHEN pr.follow_up_required = 1 AND pr.follow_up_date >= ap.ap_date THEN 'Yes' ELSE 'No' END AS is_follow_up
               FROM appointment ap
               JOIN patient p ON ap.Patient_p_id = p.p_id
               JOIN doctor d ON ap.Doctor_d_id = d.d_id
               JOIN department dept ON d.Department_dept_id = dept.dept_id
               JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
               JOIN appointment_slots s ON ap.slot_id = s.slot_id
               LEFT JOIN prescription pr ON pr.ap_id = ap.ap_id
               WHERE ap.Doctor_d_id = ? AND (ap.status IS NULL OR ap.status != 'Completed')
               ORDER BY ap.ap_date`;
    }

    console.log('Doctor appointments SQL:', sql);

    db.query(sql, params, (err2, rows) => {
      if (err2) {
        console.error('Error fetching doctor appointments:', err2);
        return res.status(500).json({ error: err2.message });
      }

      console.log('Found appointments:', rows.length);

      // Get completed appointments count for today
      const completedSql = `
        SELECT COUNT(*) as completed_count 
        FROM appointment ap 
        JOIN doctor d ON ap.Doctor_d_id = d.d_id 
        WHERE d.d_id = ? AND DATE(ap.ap_date) = CURDATE() AND ap.status = 'Completed'
      `;

      db.query(completedSql, [d_id], (err3, completedRows) => {
        if (err3) return res.status(500).json({ error: err3.message });

        const completedCount = completedRows[0].completed_count;

        res.json({
          appointments: rows,
          completed_count: completedCount,
          remaining_count: rows.length
        });
      });
    });
  });
});

// 2. Allow doctor to write prescription for an appointment
app.post('/api/appointments/:ap_id/prescription', isDoctor, (req, res) => {
  const { ap_id } = req.params;
  const { diagnosis, follow_up_required, follow_up_date, notes, medicines } = req.body;

  console.log('Prescription submission:', { ap_id, diagnosis, follow_up_required, follow_up_date, notes, medicines });

  // First check if appointment is completed
  db.query('SELECT status FROM appointment WHERE ap_id = ?', [ap_id], (err, statusRows) => {
    if (err) {
      console.error('Error checking appointment status:', err);
      return res.status(500).json({ error: 'Error checking appointment status: ' + err.message });
    }

    if (!statusRows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (statusRows[0].status === 'Completed') {
      return res.status(400).json({ error: 'Cannot write prescription for completed appointment' });
    }

    // Check medicine stock availability
    if (Array.isArray(medicines) && medicines.length > 0) {
      const medicineChecks = medicines.map(m => {
        return new Promise((resolve, reject) => {
          db.query('SELECT m_id, m_name, quantity, price FROM medicine WHERE m_id = ?', [m.m_id], (err, results) => {
            if (err) reject(err);
            if (!results.length) {
              reject(new Error(`Medicine with ID ${m.m_id} not found`));
            }
            const medicine = results[0];
            if (medicine.quantity === null || medicine.quantity === undefined) {
              reject(new Error(`${medicine.m_name} is out of stock`));
            }
            if (medicine.quantity < m.quantity) {
              reject(new Error(`Insufficient stock for ${medicine.m_name}. Available: ${medicine.quantity}, Requested: ${m.quantity}`));
            }
            resolve(medicine);
          });
        });
      });

      Promise.all(medicineChecks)
        .then(() => {
          // All medicines are available, proceed with prescription creation
          createPrescription();
        })
        .catch(error => {
          console.error('Medicine stock check failed:', error);
          return res.status(400).json({ error: error.message });
        });
    } else {
      // No medicines to check, proceed with prescription creation
      createPrescription();
    }

    function createPrescription() {
      const sql = `INSERT INTO prescription (ap_id, diagnosis, follow_up_required, follow_up_date, notes) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [ap_id, diagnosis, follow_up_required || 0, follow_up_date || null, notes || ''], (err2, result) => {
        if (err2) {
          console.error('Error inserting prescription:', err2);
          return res.status(500).json({ error: err2.message });
        }
        const prescription_id = result.insertId;
        console.log('Prescription created with ID:', prescription_id);

        // Insert medicines and update stock
        if (Array.isArray(medicines) && medicines.length > 0) {
          console.log('Inserting medicines:', medicines);
          const values = medicines.map(m => [m.m_id, prescription_id, m.quantity || 1]);
          console.log('Medicine values to insert:', values);

          // Insert medicine bill
          db.query('INSERT INTO mediciene_bill (m_id, prescription_id, quantity) VALUES ?', [values], (err3) => {
            if (err3) {
              console.error('Error inserting medicines:', err3);
              return res.status(500).json({ error: err3.message });
            }

            // Update medicine stock
            const updatePromises = medicines.map(m => {
              return new Promise((resolve, reject) => {
                db.query('UPDATE medicine SET quantity = quantity - ? WHERE m_id = ?', [m.quantity || 1, m.m_id], (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            });

            Promise.all(updatePromises)
              .then(() => {
                console.log('Medicines inserted and stock updated successfully');
                res.json({ success: true, prescription_id });
              })
              .catch(error => {
                console.error('Error updating medicine stock:', error);
                return res.status(500).json({ error: 'Error updating medicine stock: ' + error.message });
              });
          });
        } else {
          console.log('No medicines to insert');
          res.json({ success: true, prescription_id });
        }
      });
    }
  });
});

// GET ALL MEDICINES
app.get('/api/medicines', (req, res) => {
  db.query('SELECT * FROM medicine', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 6. View existing bill for completed appointment
app.get('/api/appointments/:id/bill/view', isReceptionist, (req, res) => {
  const { id } = req.params;
  console.log('Viewing bill for appointment ID:', id);

  // Check if appointment is completed and has a bill
  db.query('SELECT status FROM appointment WHERE ap_id = ?', [id], (err, statusRows) => {
    if (err) {
      console.error('Error checking appointment status:', err);
      return res.status(500).json({ error: 'Error checking appointment status: ' + err.message });
    }

    if (!statusRows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (statusRows[0].status !== 'Completed') {
      return res.status(400).json({ error: 'Can only view bills for completed appointments' });
    }

    // Get existing bill from fee table
    db.query('SELECT * FROM fee WHERE ap_id = ?', [id], (err2, feeRows) => {
      if (err2) {
        console.error('Error getting fee:', err2);
        return res.status(500).json({ error: 'Error getting fee: ' + err2.message });
      }

      if (!feeRows.length) {
        return res.status(404).json({ error: 'No bill found for this appointment' });
      }

      const fee = feeRows[0];

      // Get appointment details with patient and doctor info
      const appointmentSql = `
        SELECT d.d_name, p.p_name, p.Blood_Group, p.p_id
        FROM appointment ap
        JOIN doctor d ON ap.Doctor_d_id = d.d_id
        JOIN patient p ON ap.Patient_p_id = p.p_id
        WHERE ap.ap_id = ?
      `;

      db.query(appointmentSql, [id], (err3, appointmentRows) => {
        if (err3) {
          console.error('Error getting appointment details:', err3);
          return res.status(500).json({ error: 'Error getting appointment details: ' + err3.message });
        }

        if (!appointmentRows.length) {
          return res.status(404).json({ error: 'Appointment details not found' });
        }

        const appointment = appointmentRows[0];

        // Get medicine bill
        const medSql = `
          SELECT SUM(m.price * mb.quantity) AS medicine_total
          FROM prescription pr
          JOIN mediciene_bill mb ON pr.prescription_id = mb.prescription_id
          JOIN medicine m ON mb.m_id = m.m_id
          WHERE pr.ap_id = ?
        `;

        db.query(medSql, [id], (err4, medRows) => {
          if (err4) {
            console.error('Error getting medicine bill:', err4);
            return res.status(500).json({ error: 'Error getting medicine bill: ' + err4.message });
          }

          const medicine_total = medRows[0].medicine_total || 0;
          const doctor_fee = Number(fee.amount) - Number(medicine_total);

          // Get medical records for this patient
          const medicalRecordSql = `
            SELECT diaganosis, mr_id
            FROM medical_record 
            WHERE Patient_p_id = ?
            ORDER BY mr_id DESC
            LIMIT 5
          `;

          db.query(medicalRecordSql, [appointment.p_id], (err5, medicalRecords) => {
            if (err5) {
              console.error('Error getting medical records:', err5);
              return res.status(500).json({ error: 'Error getting medical records: ' + err5.message });
            }

            const billResponse = {
              fee_id: fee.fee_id,
              hospital_name: "DOCTOR'S HOSPITAL",
              doctor_name: appointment.d_name,
              patient_name: appointment.p_name,
              blood_group: appointment.Blood_Group,
              receptionist_name: 'Receptionist', // Default since we don't store this
              timestamp: fee.date_paid || new Date().toISOString(),
              doctor_fee: doctor_fee,
              medicine_total: medicine_total,
              total: fee.amount,
              medical_records: medicalRecords,
              status: fee.status
            };

            console.log('Bill retrieved successfully:', billResponse);
            res.json(billResponse);
          });
        });
      });
    });
  });
});

// 7. Get appointment details
app.get('/api/appointments/:id', isReceptionist, (req, res) => {
  const { id } = req.params;
  console.log('Getting details for appointment ID:', id);

  const sql = `
    SELECT 
      ap.*,
      p.p_name,
      p.Blood_Group,
      d.d_name,
      dept.dept_name,
      ct.day_of_week,
      ct.start_time,
      ct.end_time,
      s.slot_start,
      s.slot_end
    FROM appointment ap
    JOIN patient p ON ap.Patient_p_id = p.p_id
    JOIN doctor d ON ap.Doctor_d_id = d.d_id
    JOIN department dept ON d.Department_dept_id = dept.dept_id
    JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
    JOIN appointment_slots s ON ap.slot_id = s.slot_id
    WHERE ap.ap_id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error getting appointment details:', err);
      return res.status(500).json({ error: 'Error getting appointment details: ' + err.message });
    }

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = rows[0];

    // Get prescription if exists
    db.query('SELECT * FROM prescription WHERE ap_id = ?', [id], (err2, prescriptionRows) => {
      if (err2) {
        console.error('Error getting prescription:', err2);
        return res.status(500).json({ error: 'Error getting prescription: ' + err2.message });
      }

      // Get fee if exists
      db.query('SELECT * FROM fee WHERE ap_id = ?', [id], (err3, feeRows) => {
        if (err3) {
          console.error('Error getting fee:', err3);
          return res.status(500).json({ error: 'Error getting fee: ' + err3.message });
        }

        const response = {
          ...appointment,
          prescription: prescriptionRows[0] || null,
          fee: feeRows[0] || null
        };

        console.log('Appointment details retrieved successfully');
        res.json(response);
      });
    });
  });
});

// Enhanced patient registration endpoint for receptionists
app.post('/api/receptionist/patient/register', isReceptionist, (req, res) => {
  const {
    p_name,
    phone_no,
    CNIC,
    gender,
    Blood_Group,
    Relative_name,
    age,
    weight,
    ward_id,
    department
  } = req.body;

  if (!p_name || !phone_no || !CNIC || !gender || !Blood_Group || !Relative_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get next p_id (auto-increment)
  db.query('SELECT MAX(p_id) as max_id FROM patient', (err, maxResult) => {
    if (err) {
      console.error('Error getting max p_id:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const nextId = (maxResult[0].max_id || 0) + 1;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const patientData = {
      p_id: nextId,
      p_name,
      admit_date: currentDate,
      ward_id: ward_id || null,
      Relative_name,
      phone_no,
      CNIC,
      gender,
      Blood_Group,
      department: department || null,
      age: age || null,
      weight: weight || null
    };

    db.query('INSERT INTO patient SET ?', patientData, (err2, result) => {
      if (err2) {
        console.error('Error inserting patient:', err2);
        return res.status(500).json({ error: 'Error creating patient: ' + err2.message });
      }

      console.log('Patient registered successfully:', { p_id: nextId, p_name });
      res.json({
        success: true,
        p_id: nextId,
        message: 'Patient registered successfully'
      });
    });
  });
});

// Get patients without appointments (for dropdown)
app.get('/api/patients/without-appointments', isReceptionist, (req, res) => {
  const sql = `
    SELECT p.*, w.ward_name, d.dept_name AS department_name
    FROM patient p
    LEFT JOIN ward w ON p.ward_id = w.ward_id
    LEFT JOIN department d ON p.department = d.dept_id
    WHERE p.p_id NOT IN (
      SELECT DISTINCT ap.Patient_p_id 
      FROM appointment ap 
      WHERE ap.status IN ('Scheduled', 'Completed')
    )
    ORDER BY p.p_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching patients without appointments:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Get doctors with clinical timings
// Allow both receptionist and patient to fetch doctors with timings
app.get('/api/doctors/with-timings', (req, res) => {
  const sql = `
    SELECT DISTINCT d.d_id, d.d_name, dept.dept_name AS department_name
    FROM doctor d
    JOIN clinical_timings ct ON d.d_id = ct.doctor_id
    JOIN department dept ON d.Department_dept_id = dept.dept_id
    ORDER BY d.d_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching doctors with timings:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Get clinical timings for a specific doctor
// Allow both receptionist and patient to fetch timings for a doctor
app.get('/api/doctors/:doctor_id/timings', (req, res) => {
  const { doctor_id } = req.params;

  const sql = `
    SELECT ct.*, d.d_name
    FROM clinical_timings ct
    JOIN doctor d ON ct.doctor_id = d.d_id
    WHERE ct.doctor_id = ?
    ORDER BY FIELD(ct.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
  `;

  db.query(sql, [doctor_id], (err, results) => {
    if (err) {
      console.error('Error fetching doctor timings:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Cancel appointment
app.put('/api/appointments/:id/cancel', isReceptionist, (req, res) => {
  const { id } = req.params;

  // First get the slot_id for this appointment
  db.query('SELECT slot_id FROM appointment WHERE ap_id = ?', [id], (err, appointmentRows) => {
    if (err) {
      console.error('Error getting appointment details:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!appointmentRows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const slot_id = appointmentRows[0].slot_id;

    // Update appointment status to cancelled
    db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Cancelled', id], (err2) => {
      if (err2) {
        console.error('Error cancelling appointment:', err2);
        return res.status(500).json({ error: 'Error cancelling appointment' });
      }

      // Reset the slot booking
      db.query('UPDATE appointment_slots SET is_booked = 0 WHERE slot_id = ?', [slot_id], (err3) => {
        if (err3) {
          console.error('Error resetting slot:', err3);
        }
      });

      console.log('Appointment cancelled successfully:', id);
      res.json({ success: true, message: 'Appointment cancelled successfully' });
    });
  });
});

// Reset all slots (set is_booked to 0)
app.put('/api/slots/reset', isReceptionist, (req, res) => {
  db.query('UPDATE appointment_slots SET is_booked = 0', (err) => {
    if (err) {
      console.error('Error resetting slots:', err);
      return res.status(500).json({ error: 'Error resetting slots' });
    }

    console.log('All slots reset successfully');
    res.json({ success: true, message: 'All slots reset successfully' });
  });
});

// Patient appointment endpoints
app.post('/api/patient/appointments', (req, res) => {
  const { Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, ap_date } = req.body;

  if (!Patient_p_id || !Doctor_d_id || !timing_id || !appointment_mode || !slot_id || !ap_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if slot is available
  db.query('SELECT is_booked FROM appointment_slots WHERE slot_id = ?', [slot_id], (err, slotRows) => {
    if (err) {
      console.error('Error checking slot availability:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!slotRows.length) {
      return res.status(400).json({ error: 'Invalid slot selected' });
    }

    if (slotRows[0].is_booked) {
      return res.status(400).json({ error: 'Selected slot is already booked' });
    }

    // Create appointment
    const sql = `INSERT INTO appointment (ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, status) VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`;
    db.query(sql, [ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id], (err2, result) => {
      if (err2) {
        console.error('Error creating appointment:', err2);
        return res.status(500).json({ error: 'Error creating appointment' });
      }

      // Mark slot as booked
      db.query('UPDATE appointment_slots SET is_booked = 1 WHERE slot_id = ?', [slot_id], (err3) => {
        if (err3) {
          console.error('Error updating slot status:', err3);
        }
      });

      console.log('Patient appointment created:', { ap_id: result.insertId, Patient_p_id });
      res.json({ success: true, ap_id: result.insertId });
    });
  });
});

app.get('/api/patient/:p_id/appointments', (req, res) => {
  const { p_id } = req.params;

  const sql = `
    SELECT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
           d.d_name, dept.dept_name,
           ct.day_of_week, ct.start_time, ct.end_time,
           s.slot_start, s.slot_end
    FROM appointment ap
    JOIN doctor d ON ap.Doctor_d_id = d.d_id
    JOIN department dept ON d.Department_dept_id = dept.dept_id
    JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
    JOIN appointment_slots s ON ap.slot_id = s.slot_id
    WHERE ap.Patient_p_id = ?
    ORDER BY ap.ap_date DESC
  `;

  db.query(sql, [p_id], (err, results) => {
    if (err) {
      console.error('Error fetching patient appointments:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

// 8. Mark appointment as completed and update fee status
app.put('/api/appointments/:id/status', isReceptionist, (req, res) => {
  const { id } = req.params;
  console.log('Marking appointment as completed:', id);

  // Update appointment status to completed
  db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Completed', id], (err) => {
    if (err) {
      console.error('Error updating appointment status:', err);
      return res.status(500).json({ error: 'Error updating appointment status: ' + err.message });
    }

    // Update fee status to paid
    db.query('UPDATE fee SET status = ? WHERE ap_id = ?', ['Paid', id], (err2) => {
      if (err2) {
        console.error('Error updating fee status:', err2);
        return res.status(500).json({ error: 'Error updating fee status: ' + err2.message });
      }

      console.log('Appointment and fee status updated successfully');
      res.json({ message: 'Appointment marked as completed and fee marked as paid' });
    });
  });
});

// 9. Get appointment details
app.get('/api/appointments/:id', isReceptionist, (req, res) => {
  const { id } = req.params;
  console.log('Getting details for appointment ID:', id);

  const sql = `
    SELECT 
      ap.*,
      p.p_name,
      p.Blood_Group,
      d.d_name,
      dept.dept_name,
      ct.day_of_week,
      ct.start_time,
      ct.end_time,
      s.slot_start,
      s.slot_end
    FROM appointment ap
    JOIN patient p ON ap.Patient_p_id = p.p_id
    JOIN doctor d ON ap.Doctor_d_id = d.d_id
    JOIN department dept ON d.Department_dept_id = dept.dept_id
    JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
    JOIN appointment_slots s ON ap.slot_id = s.slot_id
    WHERE ap.ap_id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error getting appointment details:', err);
      return res.status(500).json({ error: 'Error getting appointment details: ' + err.message });
    }

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = rows[0];

    // Get prescription if exists
    db.query('SELECT * FROM prescription WHERE ap_id = ?', [id], (err2, prescriptionRows) => {
      if (err2) {
        console.error('Error getting prescription:', err2);
        return res.status(500).json({ error: 'Error getting prescription: ' + err2.message });
      }

      // Get fee if exists
      db.query('SELECT * FROM fee WHERE ap_id = ?', [id], (err3, feeRows) => {
        if (err3) {
          console.error('Error getting fee:', err3);
          return res.status(500).json({ error: 'Error getting fee: ' + err3.message });
        }

        const response = {
          ...appointment,
          prescription: prescriptionRows[0] || null,
          fee: feeRows[0] || null
        };

        console.log('Appointment details retrieved successfully');
        res.json(response);
      });
    });
  });
});

// Patient registration endpoint (for patients to register themselves)
app.post('/api/patient/register', (req, res) => {
  const {
    p_name, phone_no, CNIC, gender, Blood_Group, Relative_name,
    username, password, security_question, security_answer
  } = req.body;

  // Validate required fields
  if (!p_name || !phone_no || !CNIC || !gender || !Blood_Group || !Relative_name || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if username already exists
  db.query('SELECT username FROM userlogin WHERE username = ?', [username], (err, existingUsers) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if CNIC already exists
    db.query('SELECT p_id FROM patient WHERE CNIC = ?', [CNIC], (err2, existingPatients) => {
      if (err2) {
        console.error('Error checking CNIC:', err2);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingPatients.length > 0) {
        return res.status(400).json({ error: 'Patient with this CNIC already exists' });
      }

      // Get the next p_id
      db.query('SELECT MAX(p_id) as max_id FROM patient', (err3, maxIdResult) => {
        if (err3) {
          console.error('Error getting max p_id:', err3);
          return res.status(500).json({ error: 'Database error' });
        }

        const nextPId = (maxIdResult[0].max_id || 0) + 1;

        // Insert patient record
        const patientData = {
          p_id: nextPId,
          p_name,
          phone_no,
          CNIC,
          gender,
          Blood_Group,
          Relative_name,
          admit_date: new Date()
        };

        db.query('INSERT INTO patient SET ?', patientData, (err4, patientResult) => {
          if (err4) {
            console.error('Error inserting patient:', err4);
            return res.status(500).json({ error: 'Error creating patient record' });
          }

          // Insert userlogin record
          const userloginData = {
            username,
            password,
            security_question,
            security_answer,
            staff_id: null, // null for patients
            p_id: nextPId
          };

          db.query('INSERT INTO userlogin SET ?', userloginData, (err5, userResult) => {
            if (err5) {
              console.error('Error inserting userlogin:', err5);
              // Rollback patient insertion
              db.query('DELETE FROM patient WHERE p_id = ?', [nextPId]);
              return res.status(500).json({ error: 'Error creating user account' });
            }

            console.log('Patient registered successfully:', { p_id: nextPId, username });
            res.json({
              success: true,
              message: 'Registration successful',
              p_id: nextPId,
              username
            });
          });
        });
      });
    });
  });
});

// Patient appointment endpoints
app.post('/api/patient/appointments', (req, res) => {
  const { Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, ap_date } = req.body;

  if (!Patient_p_id || !Doctor_d_id || !timing_id || !appointment_mode || !slot_id || !ap_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if slot is available
  db.query('SELECT is_booked FROM appointment_slots WHERE slot_id = ?', [slot_id], (err, slotRows) => {
    if (err) {
      console.error('Error checking slot availability:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!slotRows.length) {
      return res.status(400).json({ error: 'Invalid slot selected' });
    }

    if (slotRows[0].is_booked) {
      return res.status(400).json({ error: 'Selected slot is already booked' });
    }

    // Create appointment
    const sql = `INSERT INTO appointment (ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id, status) VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')`;
    db.query(sql, [ap_date, Patient_p_id, Doctor_d_id, timing_id, appointment_mode, slot_id], (err2, result) => {
      if (err2) {
        console.error('Error creating appointment:', err2);
        return res.status(500).json({ error: 'Error creating appointment' });
      }

      // Mark slot as booked
      db.query('UPDATE appointment_slots SET is_booked = 1 WHERE slot_id = ?', [slot_id], (err3) => {
        if (err3) {
          console.error('Error updating slot status:', err3);
        }
      });

      console.log('Patient appointment created:', { ap_id: result.insertId, Patient_p_id });
      res.json({ success: true, ap_id: result.insertId });
    });
  });
});

app.get('/api/patient/:p_id/appointments', (req, res) => {
  const { p_id } = req.params;

  const sql = `
    SELECT ap.ap_id, ap.ap_date, ap.appointment_mode, ap.status,
           d.d_name, dept.dept_name,
           ct.day_of_week, ct.start_time, ct.end_time,
           s.slot_start, s.slot_end
    FROM appointment ap
    JOIN doctor d ON ap.Doctor_d_id = d.d_id
    JOIN department dept ON d.Department_dept_id = dept.dept_id
    JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
    JOIN appointment_slots s ON ap.slot_id = s.slot_id
    WHERE ap.Patient_p_id = ?
    ORDER BY ap.ap_date DESC
  `;

  db.query(sql, [p_id], (err, results) => {
    if (err) {
      console.error('Error fetching patient appointments:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

// Get appointment status
app.get('/api/appointments/:id/status', isReceptionist, (req, res) => {
  const { id } = req.params;
  console.log('=== FETCHING APPOINTMENT STATUS ===');
  console.log('Appointment ID:', id);

  const sql = 'SELECT ap_id, status FROM appointment WHERE ap_id = ?';
  console.log('SQL Query:', sql);

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching appointment status:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      console.error('Appointment not found:', id);
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('Appointment status result:', results[0]);
    res.json(results[0]);
  });
});

// ---------------------- Receptionist: Admission Module ----------------------
// Get wards by department
app.get('/api/wards/by-department/:dept_id', isReceptionist, (req, res) => {
  const { dept_id } = req.params;
  db.query('SELECT ward_id, ward_name, capacity, dept_id, nurse_id FROM ward WHERE dept_id = ?', [dept_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get nurse for a ward
app.get('/api/wards/:ward_id/nurse', isReceptionist, (req, res) => {
  const { ward_id } = req.params;
  db.query('SELECT nurse_id FROM ward WHERE ward_id = ?', [ward_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Ward not found' });
    res.json(rows[0]);
  });
});

// Receptionist: list all patients (for admission)
app.get('/api/receptionist/patients/all', isReceptionist, (req, res) => {
  db.query('SELECT * FROM patient ORDER BY p_name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create admission
app.post('/api/admissions', isReceptionist, (req, res) => {
  const {
    patient_id,
    ward_id,
    doctor_id,
    admission_type,
    reason,
    date_admitted,
    expected_discharge,
    surgery_required
  } = req.body || {};

  if (!patient_id || !ward_id || !admission_type) {
    return res.status(400).json({ error: 'patient_id, ward_id and admission_type are required' });
  }

  const data = {
    patient_id,
    ward_id,
    doctor_id: doctor_id || null,
    admission_type,
    reason: reason || null,
    date_admitted: date_admitted || new Date(),
    expected_discharge: expected_discharge || null,
    surgery_required: surgery_required ? 1 : 0,
    status: 'Admitted',
  };

  db.query('INSERT INTO admission SET ?', data, (err, result) => {
    if (err) {
      const msg = err.code && err.code.includes('ER_NO_REFERENCED_ROW') ? 'Foreign key constraint violation' : err.message;
      const status = msg.includes('Foreign key') ? 409 : 500;
      return res.status(status).json({ error: msg });
    }
    res.json({ admission_id: result.insertId, ...data });
  });
});

// List admissions with joined info
app.get('/api/admissions', isReceptionist, (req, res) => {
  const sql = `
    SELECT a.*, p.p_name, w.ward_name, d.d_name
    FROM admission a
    JOIN patient p ON a.patient_id = p.p_id
    JOIN ward w ON a.ward_id = w.ward_id
    LEFT JOIN doctor d ON a.doctor_id = d.d_id
    ORDER BY a.admission_id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add medicine to an admission (nurse rounds)
app.post('/api/admissions/:admission_id/medicine', (req, res) => {
  const { admission_id } = req.params;
  const { m_id, quantity } = req.body || {};
  if (!m_id || !quantity) return res.status(400).json({ error: 'm_id and quantity are required' });

  // Check stock
  db.query('SELECT quantity, m_name FROM medicine WHERE m_id = ?', [m_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Medicine not found' });
    const stock = rows[0].quantity;
    if (stock === null || stock === undefined || stock < quantity) {
      return res.status(400).json({ error: `Insufficient stock for medicine (available: ${stock ?? 0})` });
    }

    // Insert administration record
    db.query('INSERT INTO admission_medicine (admission_id, m_id, quantity) VALUES (?, ?, ?)', [admission_id, m_id, quantity], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // Deduct stock
      db.query('UPDATE medicine SET quantity = quantity - ? WHERE m_id = ?', [quantity, m_id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ success: true });
      });
    });
  });
});

// List medicines given in an admission
app.get('/api/admissions/:admission_id/medicines', isReceptionist, (req, res) => {
  const { admission_id } = req.params;
  const sql = `
    SELECT am.id, am.quantity, am.administered_at, m.m_name, m.price
    FROM admission_medicine am
    JOIN medicine m ON am.m_id = m.m_id
    WHERE am.admission_id = ?
    ORDER BY am.administered_at DESC
  `;
  db.query(sql, [admission_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Discharge and generate admission bill
app.post('/api/admissions/:admission_id/discharge-bill', isReceptionist, (req, res) => {
  const { admission_id } = req.params;
  // Sum medicines administered
  const medSql = `
    SELECT SUM(m.price * am.quantity) AS med_total
    FROM admission_medicine am
    JOIN medicine m ON am.m_id = m.m_id
    WHERE am.admission_id = ?
  `;
  db.query(medSql, [admission_id], (err, medRows) => {
    if (err) return res.status(500).json({ error: err.message });
    const medicine_total = Number(medRows[0]?.med_total || 0);

    const totalAmount = medicine_total;

    // Insert fee row linked by admission_id
    const feeData = {
      admission_id: admission_id,
      amount: totalAmount,
      status: 'Paid',
      date_paid: new Date(),
    };
    db.query('INSERT INTO fee SET ?', feeData, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const fee_id = result.insertId;

      // Update admission status to Discharged
      db.query("UPDATE admission SET status = 'Discharged' WHERE admission_id = ?", [admission_id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ fee_id, total: totalAmount, medicine_total, status: 'Discharged' });
      });
    });
  });
});

// ---------------------- Admin Module ----------------------
function isAdmin(req, res, next) {
  if (req.headers.role && req.headers.role.toString() === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden: Admin access only' });
}

let fkChecksState = 1; // tracks last requested state for UI

// Foreign key checks toggle
app.post('/api/admin/foreign-key-checks', isAdmin, (req, res) => {
  const value = Number((req.body && req.body.value) ?? 1) === 0 ? 0 : 1;
  db.query('SET FOREIGN_KEY_CHECKS = ?', [value], (err) => {
    if (err) {
      console.error('Error setting FOREIGN_KEY_CHECKS (session):', err);
      return res.status(500).json({ error: 'Failed to set FOREIGN_KEY_CHECKS: ' + err.message });
    }
    // Try GLOBAL (may fail without privileges); ignore error but log it
    db.query('SET GLOBAL FOREIGN_KEY_CHECKS = ?', [value], (err2) => {
      if (err2) {
        console.warn('SET GLOBAL FOREIGN_KEY_CHECKS failed (non-fatal):', err2.message);
      }
      fkChecksState = value;
      res.json({ success: true, value });
    });
  });
});

// Collections for overview
app.get('/api/admin/departments', isAdmin, (req, res) => {
  db.query('SELECT * FROM department', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/doctors', isAdmin, (req, res) => {
  db.query('SELECT * FROM doctor', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/nurses', isAdmin, (req, res) => {
  db.query('SELECT * FROM nurse', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/receptionists', isAdmin, (req, res) => {
  db.query('SELECT * FROM receptionist', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/interns', isAdmin, (req, res) => {
  db.query('SELECT * FROM intern', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/staff', isAdmin, (req, res) => {
  db.query('SELECT * FROM staff', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/fees', isAdmin, (req, res) => {
  db.query('SELECT * FROM fee ORDER BY COALESCE(date_paid, date_paid) DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/roles', isAdmin, (req, res) => {
  db.query('SELECT r_id AS id, r_name AS name FROM role', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Sales (assumes views daily_sales and monthly_sales exist)
app.get('/api/admin/sales/daily', isAdmin, (req, res) => {
  db.query('SELECT * FROM daily_sales', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/admin/sales/monthly', isAdmin, (req, res) => {
  db.query('SELECT * FROM monthly_sales', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Staff CRUD for admin
app.post('/api/admin/staff', isAdmin, (req, res) => {
  const {
    s_name,
    Roll_r_id,
    Department_dept_id,
    Shift_shift_id,
    CNIC,
    ph_number,
    Gender,
  } = req.body || {};

  if (!s_name || !Roll_r_id || !Department_dept_id || !Shift_shift_id) {
    return res.status(400).json({ error: 'Missing required fields: s_name, Roll_r_id, Department_dept_id, Shift_shift_id' });
  }

  // Create data object without Address_id and s_id
  const staffData = {
    s_name,
    Roll_r_id,
    Department_dept_id,
    Shift_shift_id,
    CNIC,
    ph_number,
    Gender,
    Address_id: 1, // Default address ID since the table requires it
  };

  const checkSql = `
    SELECT
      (SELECT COUNT(*) FROM role WHERE r_id = ?) AS role_ok,
      (SELECT COUNT(*) FROM department WHERE dept_id = ?) AS dept_ok,
      (SELECT COUNT(*) FROM shift WHERE shift_id = ?) AS shift_ok
  `;

  db.query(checkSql, [Roll_r_id, Department_dept_id, Shift_shift_id], (checkErr, rows) => {
    if (checkErr) {
      console.error('Error validating staff foreign keys:', checkErr);
      return res.status(500).json({ error: 'Validation error: ' + checkErr.message });
    }
    const r = rows && rows[0];
    const missing = [];
    if (!r || !r.role_ok) missing.push('role');
    if (!r || !r.dept_ok) missing.push('department');
    if (!r || !r.shift_ok) missing.push('shift');
    if (missing.length) {
      return res.status(400).json({ error: 'Invalid references: ' + missing.join(', ') });
    }

    // First get the next available s_id
    db.query('SELECT COALESCE(MAX(s_id), 0) + 1 AS next_id FROM staff', (idErr, idRows) => {
      if (idErr) {
        console.error('Error getting next staff ID:', idErr);
        return res.status(500).json({ error: 'Failed to generate staff ID' });
      }

      const nextId = idRows[0].next_id;
      const insertData = { ...staffData, s_id: nextId };

      db.query('INSERT INTO staff SET ?', insertData, (err, result) => {
        if (err) {
          console.error('Insert staff error:', err);
          const msg = err.code && err.code.includes('ER_NO_REFERENCED_ROW') ? 'Foreign key constraint violation' : err.message;
          const status = msg.includes('Foreign key') ? 409 : 500;
          return res.status(status).json({ error: msg });
        }
        res.json({ s_id: nextId, ...staffData });
      });
    });
  });
});

app.put('/api/admin/staff/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const data = req.body || {};
  db.query('UPDATE staff SET ? WHERE s_id = ?', [data, id], (err) => {
    if (err) {
      const msg = err.code && err.code.includes('ER_NO_REFERENCED_ROW') ? 'Foreign key constraint violation' : err.message;
      const status = msg.includes('Foreign key') ? 409 : 500;
      return res.status(status).json({ error: msg });
    }
    res.json({ success: true });
  });
});

app.delete('/api/admin/staff/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM staff WHERE s_id = ?', [id], (err) => {
    if (err) {
      const fkErr = err.code && (err.code.includes('ER_ROW_IS_REFERENCED') || err.code.includes('ER_NO_REFERENCED_ROW'));
      const msg = fkErr ? 'Foreign key constraint violation' : err.message;
      const status = fkErr ? 409 : 500;
      return res.status(status).json({ error: msg });
    }
    res.json({ success: true });
  });
});

// Create userlogin for staff
app.post('/api/admin/userlogin', isAdmin, (req, res) => {
  const { username, password, staff_id } = req.body || {};
  if (!username || !password || !staff_id) {
    return res.status(400).json({ error: 'username, password and staff_id are required' });
  }
  const data = { username, password, staff_id };
  db.query('INSERT INTO userlogin SET ?', data, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});


// Helper function to generate bill without prescription
function generateBillWithoutPrescription(appointmentId, receptionistName, res) {
  console.log('Generating bill without prescription for appointment:', appointmentId);

  // Get appointment details and doctor fee
  const sql = `
    SELECT ap.ap_id, ap.Patient_p_id, ap.Doctor_d_id,
           d.d_name, df.base_fee, df.followup_fee,
           p.p_name, p.Blood_Group
    FROM appointment ap
    JOIN doctor d ON ap.Doctor_d_id = d.d_id
    JOIN doctor_fee df ON d.d_id = df.d_id
    JOIN patient p ON ap.Patient_p_id = p.p_id
    WHERE ap.ap_id = ?
  `;

  db.query(sql, [appointmentId], (err, rows) => {
    if (err) {
      console.error('Error getting appointment details:', err);
      return res.status(500).json({ error: 'Error getting appointment details: ' + err.message });
    }

    if (!rows.length) {
      console.error('Appointment not found:', appointmentId);
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = rows[0];
    const doctorName = appointment.d_name;
    const patientName = appointment.p_name;
    const bloodGroup = appointment.Blood_Group;
    const patientId = appointment.Patient_p_id;
    const fee = appointment.base_fee; // Use base fee for appointments without prescription
    const total = Number(fee);

    console.log('Bill calculation (no prescription):', { doctor_fee: fee, total });

    // Insert bill into fee table
    const billData = {
      ap_id: appointmentId,
      amount: total,
      status: 'Paid', // Mark as paid immediately
      date_paid: new Date()
    };

    console.log('Inserting bill data (no prescription):', billData);

    db.query('INSERT INTO fee SET ?', billData, (err2, result) => {
      if (err2) {
        console.error('Error inserting bill:', err2);
        return res.status(500).json({ error: 'Error inserting bill: ' + err2.message });
      }

      const fee_id = result.insertId;
      const timestamp = new Date().toISOString();
      const hospitalName = "DOCTOR'S HOSPITAL";

      console.log('Bill inserted successfully, fee_id:', fee_id);
      console.log('Now updating appointment status to Completed...');

      // Mark appointment as completed
      db.query('UPDATE appointment SET status = ? WHERE ap_id = ?', ['Completed', appointmentId], (err3) => {
        if (err3) {
          console.error('Error updating appointment status:', err3);
        } else {
          console.log('Appointment marked as completed successfully');
        }

        const billResponse = {
          fee_id,
          hospital_name: hospitalName,
          doctor_name: doctorName,
          patient_name: patientName,
          blood_group: bloodGroup,
          receptionist_name: receptionistName,
          timestamp,
          doctor_fee: fee,
          medicine_total: 0,
          total,
          medical_records: [],
          medicines: [],
          status: 'Completed'
        };

        console.log('Bill generated successfully (no prescription):', billResponse);
        console.log('=== END BILL GENERATION DEBUG ===');
        res.json(billResponse);
      });
    });
  });
} 
