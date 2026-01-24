-- ============================================================
-- Hospital Management System - MySQL Database Schema
-- Compatible with MySQL 8.x
-- ============================================================

-- Drop database if exists (for clean setup)
DROP DATABASE IF EXISTS hospital_management;

-- Create database
CREATE DATABASE hospital_management;
USE hospital_management;

-- ============================================================
-- REFERENCE TABLES
-- ============================================================

-- Country table: Stores country information for patient addresses
CREATE TABLE country (
    country_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blood group table: Stores available blood groups
CREATE TABLE blood_group (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(10) NOT NULL UNIQUE COMMENT 'Blood group type (A+, B+, O+, AB+, etc.)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role table: Defines staff roles (Doctor, Nurse, Receptionist, Admin, etc.)
CREATE TABLE role (
    r_id INT AUTO_INCREMENT PRIMARY KEY,
    r_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Role name (Doctor, Nurse, Receptionist, Admin, etc.)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift table: Defines work shifts for staff
CREATE TABLE shift (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_type VARCHAR(50) NOT NULL COMMENT 'Shift type (Morning, Evening, Night, etc.)',
    start_time TIME NOT NULL COMMENT 'Shift start time',
    end_time TIME NOT NULL COMMENT 'Shift end time'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Address table: Stores address information (referenced by staff)
CREATE TABLE address (
    Address_id INT AUTO_INCREMENT PRIMARY KEY,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country_id VARCHAR(10),
    FOREIGN KEY (country_id) REFERENCES country(country_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEPARTMENT AND WARD TABLES
-- ============================================================

-- Department table: Hospital departments (Cardiology, Orthopedics, etc.)
CREATE TABLE department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Department name',
    budget DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Department budget'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ward table: Hospital wards within departments
CREATE TABLE ward (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL COMMENT 'Ward name',
    capacity INT NOT NULL DEFAULT 0 COMMENT 'Maximum bed capacity',
    dept_id INT NOT NULL COMMENT 'Department this ward belongs to',
    nurse_id INT COMMENT 'Nurse assigned to this ward (will reference nurse table)',
    FOREIGN KEY (dept_id) REFERENCES department(dept_id) ON DELETE RESTRICT,
    INDEX idx_dept (dept_id),
    INDEX idx_nurse (nurse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STAFF TABLES
-- ============================================================

-- Staff table: Base table for all hospital staff
CREATE TABLE staff (
    s_id INT AUTO_INCREMENT PRIMARY KEY,
    s_name VARCHAR(100) NOT NULL COMMENT 'Staff member name',
    Roll_r_id INT NOT NULL COMMENT 'Role ID',
    Department_dept_id INT NOT NULL COMMENT 'Department ID',
    Shift_shift_id INT NOT NULL COMMENT 'Shift ID',
    CNIC VARCHAR(20) UNIQUE COMMENT 'CNIC number',
    ph_number VARCHAR(20) COMMENT 'Phone number',
    Gender ENUM('Male', 'Female', 'Other') COMMENT 'Gender',
    join_date DATE COMMENT 'Date of joining',
    Address_id INT DEFAULT 1 COMMENT 'Address ID',
    FOREIGN KEY (Roll_r_id) REFERENCES role(r_id) ON DELETE RESTRICT,
    FOREIGN KEY (Department_dept_id) REFERENCES department(dept_id) ON DELETE RESTRICT,
    FOREIGN KEY (Shift_shift_id) REFERENCES shift(shift_id) ON DELETE RESTRICT,
    FOREIGN KEY (Address_id) REFERENCES address(Address_id) ON DELETE SET NULL,
    INDEX idx_role (Roll_r_id),
    INDEX idx_dept (Department_dept_id),
    INDEX idx_shift (Shift_shift_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor table: Specialized table for doctors (inherits from staff)
CREATE TABLE doctor (
    d_id INT AUTO_INCREMENT PRIMARY KEY,
    d_name VARCHAR(100) NOT NULL COMMENT 'Doctor name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    Department_dept_id INT NOT NULL COMMENT 'Department ID',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    FOREIGN KEY (Department_dept_id) REFERENCES department(dept_id) ON DELETE RESTRICT,
    INDEX idx_staff (Staff_s_id),
    INDEX idx_dept (Department_dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor fee table: Stores consultation fees for doctors
CREATE TABLE doctor_fee (
    d_id INT PRIMARY KEY,
    base_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Base consultation fee',
    followup_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Follow-up consultation fee',
    FOREIGN KEY (d_id) REFERENCES doctor(d_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nurse table: Specialized table for nurses (inherits from staff)
CREATE TABLE nurse (
    n_id INT AUTO_INCREMENT PRIMARY KEY,
    n_name VARCHAR(100) NOT NULL COMMENT 'Nurse name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    INDEX idx_staff (Staff_s_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receptionist table: Specialized table for receptionists (inherits from staff)
CREATE TABLE receptionist (
    rec_id INT AUTO_INCREMENT PRIMARY KEY,
    rec_name VARCHAR(100) NOT NULL COMMENT 'Receptionist name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    INDEX idx_staff (Staff_s_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intern table: Specialized table for interns (inherits from staff)
CREATE TABLE intern (
    intern_id INT AUTO_INCREMENT PRIMARY KEY,
    intern_name VARCHAR(100) NOT NULL COMMENT 'Intern name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    INDEX idx_staff (Staff_s_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin table: Specialized table for administrators (inherits from staff)
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL COMMENT 'Admin name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    INDEX idx_staff (Staff_s_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Surgeon table: Specialized table for surgeons (inherits from staff)
CREATE TABLE surgeon (
    surgeon_id INT AUTO_INCREMENT PRIMARY KEY,
    surgeon_name VARCHAR(100) NOT NULL COMMENT 'Surgeon name',
    Staff_s_id INT NOT NULL UNIQUE COMMENT 'Staff ID reference',
    FOREIGN KEY (Staff_s_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    INDEX idx_staff (Staff_s_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraint for ward.nurse_id after nurse table is created
ALTER TABLE ward 
ADD CONSTRAINT fk_ward_nurse 
FOREIGN KEY (nurse_id) REFERENCES nurse(n_id) ON DELETE SET NULL;

-- ============================================================
-- PATIENT TABLES
-- ============================================================

-- Patient table: Stores patient information
CREATE TABLE patient (
    p_id INT AUTO_INCREMENT PRIMARY KEY,
    p_name VARCHAR(100) NOT NULL COMMENT 'Patient name',
    phone_no VARCHAR(20) COMMENT 'Phone number',
    CNIC VARCHAR(20) UNIQUE COMMENT 'CNIC number',
    gender ENUM('Male', 'Female', 'Other') COMMENT 'Gender',
    Blood_Group VARCHAR(10) COMMENT 'Blood group (stored as string, e.g., "A+", "B+", "O+")',
    Relative_name VARCHAR(100) COMMENT 'Emergency contact name',
    ward_id INT COMMENT 'Ward ID if admitted',
    department INT COMMENT 'Department ID (for initial registration)',
    age INT COMMENT 'Patient age',
    weight DECIMAL(5,2) COMMENT 'Patient weight in kg',
    admit_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date of admission/registration',
    FOREIGN KEY (ward_id) REFERENCES ward(ward_id) ON DELETE SET NULL,
    FOREIGN KEY (department) REFERENCES department(dept_id) ON DELETE SET NULL,
    INDEX idx_ward (ward_id),
    INDEX idx_dept (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical record table: Stores patient medical history
CREATE TABLE medical_record (
    mr_id INT AUTO_INCREMENT PRIMARY KEY,
    Patient_p_id INT NOT NULL COMMENT 'Patient ID',
    diaganosis VARCHAR(500) COMMENT 'Diagnosis information (note: column name has typo in original)',
    record_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date of medical record',
    FOREIGN KEY (Patient_p_id) REFERENCES patient(p_id) ON DELETE CASCADE,
    INDEX idx_patient (Patient_p_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER AUTHENTICATION
-- ============================================================

-- User login table: Stores login credentials for staff and patients
CREATE TABLE userlogin (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL COMMENT 'User password (should be hashed in production)',
    staff_id INT COMMENT 'Staff ID if user is staff',
    p_id INT COMMENT 'Patient ID if user is patient',
    security_question VARCHAR(255) COMMENT 'Security question for password recovery',
    security_answer VARCHAR(255) COMMENT 'Security answer',
    FOREIGN KEY (staff_id) REFERENCES staff(s_id) ON DELETE CASCADE,
    FOREIGN KEY (p_id) REFERENCES patient(p_id) ON DELETE CASCADE,
    CHECK (staff_id IS NOT NULL OR p_id IS NOT NULL),
    INDEX idx_staff (staff_id),
    INDEX idx_patient (p_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- APPOINTMENT TABLES
-- ============================================================

-- Clinical timings table: Stores doctor's available timings
CREATE TABLE clinical_timings (
    timing_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL COMMENT 'Doctor ID',
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL COMMENT 'Start time of clinical hours',
    end_time TIME NOT NULL COMMENT 'End time of clinical hours',
    FOREIGN KEY (doctor_id) REFERENCES doctor(d_id) ON DELETE CASCADE,
    INDEX idx_doctor (doctor_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment slots table: Stores available time slots for appointments
CREATE TABLE appointment_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    timing_id INT NOT NULL COMMENT 'Clinical timing ID',
    slot_start TIME NOT NULL COMMENT 'Slot start time',
    slot_end TIME NOT NULL COMMENT 'Slot end time',
    is_booked BOOLEAN DEFAULT FALSE COMMENT 'Whether slot is booked',
    FOREIGN KEY (timing_id) REFERENCES clinical_timings(timing_id) ON DELETE CASCADE,
    INDEX idx_timing (timing_id),
    INDEX idx_booked (is_booked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment table: Stores appointment information
CREATE TABLE appointment (
    ap_id INT AUTO_INCREMENT PRIMARY KEY,
    ap_date DATETIME NOT NULL COMMENT 'Appointment date and time',
    Patient_p_id INT NOT NULL COMMENT 'Patient ID',
    Doctor_d_id INT NOT NULL COMMENT 'Doctor ID',
    timing_id INT NOT NULL COMMENT 'Clinical timing ID',
    appointment_mode ENUM('Self', 'Staff', 'In-person', 'Online', 'Phone') DEFAULT 'Self' COMMENT 'Appointment mode',
    slot_id INT NOT NULL COMMENT 'Appointment slot ID',
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled' COMMENT 'Appointment status',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Appointment creation timestamp',
    FOREIGN KEY (Patient_p_id) REFERENCES patient(p_id) ON DELETE RESTRICT,
    FOREIGN KEY (Doctor_d_id) REFERENCES doctor(d_id) ON DELETE RESTRICT,
    FOREIGN KEY (timing_id) REFERENCES clinical_timings(timing_id) ON DELETE RESTRICT,
    FOREIGN KEY (slot_id) REFERENCES appointment_slots(slot_id) ON DELETE RESTRICT,
    INDEX idx_patient (Patient_p_id),
    INDEX idx_doctor (Doctor_d_id),
    INDEX idx_date (ap_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRESCRIPTION AND MEDICINE TABLES
-- ============================================================

-- Prescription table: Stores prescription information for appointments
CREATE TABLE prescription (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    ap_id INT NOT NULL UNIQUE COMMENT 'Appointment ID',
    diagnosis VARCHAR(500) COMMENT 'Diagnosis details',
    follow_up_required BOOLEAN DEFAULT FALSE COMMENT 'Whether follow-up is required',
    follow_up_date DATE COMMENT 'Follow-up appointment date',
    notes TEXT COMMENT 'Additional notes',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Prescription creation timestamp',
    FOREIGN KEY (ap_id) REFERENCES appointment(ap_id) ON DELETE CASCADE,
    INDEX idx_appointment (ap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medicine table: Stores medicine inventory
CREATE TABLE medicine (
    m_id INT AUTO_INCREMENT PRIMARY KEY,
    m_name VARCHAR(100) NOT NULL COMMENT 'Medicine name',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Price per unit',
    quantity INT DEFAULT 0 COMMENT 'Available quantity in stock',
    usage_of_mediciene VARCHAR(255) COMMENT 'Usage instructions (note: column name has typo in original)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    INDEX idx_name (m_name),
    INDEX idx_stock (quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medicine bill table: Links medicines to prescriptions
CREATE TABLE mediciene_bill (
    prescription_id INT NOT NULL COMMENT 'Prescription ID',
    m_id INT NOT NULL COMMENT 'Medicine ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT 'Quantity prescribed',
    FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (m_id) REFERENCES medicine(m_id) ON DELETE RESTRICT,
    PRIMARY KEY (prescription_id, m_id),
    INDEX idx_medicine (m_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ADMISSION TABLES
-- ============================================================

-- Admission table: Stores patient admission information
CREATE TABLE admission (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL COMMENT 'Patient ID',
    ward_id INT NOT NULL COMMENT 'Ward ID',
    doctor_id INT COMMENT 'Attending doctor ID',
    admission_type ENUM('Emergency', 'Elective', 'Scheduled', 'Referral') DEFAULT 'Elective' COMMENT 'Type of admission',
    reason VARCHAR(500) COMMENT 'Reason for admission',
    date_admitted DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Admission date and time',
    expected_discharge DATE COMMENT 'Expected discharge date',
    surgery_required BOOLEAN DEFAULT FALSE COMMENT 'Whether surgery is required',
    status ENUM('Admitted', 'Discharged') DEFAULT 'Admitted' COMMENT 'Admission status',
    FOREIGN KEY (patient_id) REFERENCES patient(p_id) ON DELETE RESTRICT,
    FOREIGN KEY (ward_id) REFERENCES ward(ward_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES doctor(d_id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_ward (ward_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admission medicine table: Tracks medicines administered during admission
CREATE TABLE admission_medicine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_id INT NOT NULL COMMENT 'Admission ID',
    m_id INT NOT NULL COMMENT 'Medicine ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT 'Quantity administered',
    administered_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Time of administration',
    FOREIGN KEY (admission_id) REFERENCES admission(admission_id) ON DELETE CASCADE,
    FOREIGN KEY (m_id) REFERENCES medicine(m_id) ON DELETE RESTRICT,
    INDEX idx_admission (admission_id),
    INDEX idx_medicine (m_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BILLING TABLES
-- ============================================================

-- Fee table: Stores billing information for appointments and admissions
CREATE TABLE fee (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    ap_id INT COMMENT 'Appointment ID (if bill is for appointment)',
    admission_id INT COMMENT 'Admission ID (if bill is for admission)',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total bill amount',
    status ENUM('Paid', 'Pending', 'Cancelled') DEFAULT 'Pending' COMMENT 'Payment status',
    date_paid DATETIME COMMENT 'Payment date and time',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Bill creation timestamp',
    FOREIGN KEY (ap_id) REFERENCES appointment(ap_id) ON DELETE SET NULL,
    FOREIGN KEY (admission_id) REFERENCES admission(admission_id) ON DELETE SET NULL,
    CHECK (ap_id IS NOT NULL OR admission_id IS NOT NULL),
    INDEX idx_appointment (ap_id),
    INDEX idx_admission (admission_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEWS (for reporting and easier querying)
-- ============================================================

-- Receptionist appointment view: Comprehensive view for appointment management
CREATE OR REPLACE VIEW receptionist_appointment_view AS
SELECT 
    ap.ap_id,
    ap.ap_date,
    ap.appointment_mode,
    ap.status,
    p.p_id AS patient_id,
    p.p_name AS patient_name,
    p.phone_no AS patient_phone,
    p.phone_no AS phone_no,
    p.gender,
    p.Blood_Group AS patient_blood_group,
    p.Blood_Group AS Blood_Group,
    d.d_id AS doctor_id,
    d.d_name AS doctor_name,
    dept.dept_name AS department_name,
    dept.dept_name AS doctor_department,
    ct.day_of_week,
    ct.start_time,
    ct.end_time,
    s.slot_start,
    s.slot_end,
    CASE 
        WHEN pr.follow_up_required = 1 AND pr.follow_up_date >= ap.ap_date THEN 'Yes' 
        ELSE 'No' 
    END AS is_follow_up,
    pr.prescription_id,
    pr.diagnosis,
    f.fee_id,
    f.amount AS bill_amount,
    f.status AS bill_status
FROM appointment ap
JOIN patient p ON ap.Patient_p_id = p.p_id
JOIN doctor d ON ap.Doctor_d_id = d.d_id
JOIN department dept ON d.Department_dept_id = dept.dept_id
JOIN clinical_timings ct ON ap.timing_id = ct.timing_id
JOIN appointment_slots s ON ap.slot_id = s.slot_id
LEFT JOIN prescription pr ON pr.ap_id = ap.ap_id
LEFT JOIN fee f ON f.ap_id = ap.ap_id;

-- Daily sales view: Daily revenue summary
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
    DATE(date_paid) AS sale_date,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_revenue,
    SUM(CASE WHEN ap_id IS NOT NULL THEN amount ELSE 0 END) AS appointment_revenue,
    SUM(CASE WHEN admission_id IS NOT NULL THEN amount ELSE 0 END) AS admission_revenue
FROM fee
WHERE status = 'Paid' AND date_paid IS NOT NULL
GROUP BY DATE(date_paid)
ORDER BY sale_date DESC;

-- Monthly sales view: Monthly revenue summary
CREATE OR REPLACE VIEW monthly_sales AS
SELECT 
    YEAR(date_paid) AS sale_year,
    MONTH(date_paid) AS sale_month,
    DATE_FORMAT(date_paid, '%Y-%m') AS year_month,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_revenue,
    SUM(CASE WHEN ap_id IS NOT NULL THEN amount ELSE 0 END) AS appointment_revenue,
    SUM(CASE WHEN admission_id IS NOT NULL THEN amount ELSE 0 END) AS admission_revenue
FROM fee
WHERE status = 'Paid' AND date_paid IS NOT NULL
GROUP BY YEAR(date_paid), MONTH(date_paid)
ORDER BY sale_year DESC, sale_month DESC;

-- ============================================================
-- END OF SCHEMA
-- ============================================================

