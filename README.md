# Hospital Management System

A comprehensive full-stack web application designed to streamline hospital operations and improve patient care management. This system provides role-based access for administrators, doctors, receptionists, and patients, enabling efficient coordination of healthcare services.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Configuration](#database-configuration)
- [Initial Data Entry](#initial-data-entry)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)

---

## Features

### Patient Management
- Complete patient registration and profile management
- Medical history tracking
- Blood group and health information records
- Appointment scheduling and tracking

### Doctor Dashboard
- View assigned appointments and patient details
- Patient examination and prescription management
- Medical records access
- Shift-based work schedule management

### Receptionist Portal
- Patient admission and discharge processing
- Appointment scheduling and management
- Billing and invoice generation
- Patient check-in/check-out

### Administrative Panel
- User and staff management (Doctors, Nurses, Receptionists)
- Hospital resource management:
  - Department management
  - Ward/Bed management
  - Medicine inventory management
  - Shift scheduling
- System configuration and monitoring

---

## Technology Stack

### Frontend
- **React.js** - UI framework
- **CSS3** - Styling
- **JavaScript (ES6+)** - Logic

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver

### Database
- **MySQL 8.x** - Relational database

---

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL Server** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

Verify installations:
```bash
node --version
npm --version
mysql --version
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hassi711/Hospital-Management-System.git
cd Hospital-Management-System
```

### Step 2: Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 3: Create Environment Configuration

In the `backend` folder, create a `.env` file:

```bash
cd ../backend
```

Create a file named `.env` with the following content:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_management
PORT=5000
```

**Replace `your_password` with your MySQL root password.**

---

## Database Configuration

### Step 1: Open MySQL Command Line

Open MySQL Command Prompt or use MySQL Workbench:

```bash
mysql -u root -p
```

Enter your MySQL password when prompted.

### Step 2: Execute the SQL Schema

Run all the queries from the `hospital_management_schema.sql` file. You can do this in two ways:

**Option A: Using MySQL Command Line**
```sql
source path/to/hospital_management_schema.sql;
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Go to File → Open SQL Script
3. Select `hospital_management_schema.sql`
4. Execute the script (Ctrl + Shift + Enter)

### Step 3: Verify Database Creation

```sql
USE hospital_management;
SHOW TABLES;
```

You should see all the tables created successfully.

---

## Initial Data Entry

### Step 1: Insert Reference Data

Insert basic reference data that the system depends on. In MySQL, execute:

```sql
USE hospital_management;

-- Insert Countries
INSERT INTO country (country_id, name) VALUES 
('PK', 'Pakistan'),
('US', 'United States'),
('UK', 'United Kingdom'),
('CA', 'Canada'),
('AU', 'Australia');

-- Insert Blood Groups
INSERT INTO blood_group (type) VALUES 
('O+'),
('O-'),
('A+'),
('A-'),
('B+'),
('B-'),
('AB+'),
('AB-');

-- Insert Roles
INSERT INTO role (r_name) VALUES 
('Doctor'),
('Nurse'),
('Receptionist'),
('Admin'),
('Intern'),
('Surgeon');

-- Insert Shifts
INSERT INTO shift (shift_type, start_time, end_time) VALUES 
('Morning', '08:00:00', '16:00:00'),
('Evening', '16:00:00', '00:00:00'),
('Night', '00:00:00', '08:00:00');

-- Insert Address (Default Address)
INSERT INTO address (street, city, state, zip_code, country_id) VALUES 
('123 Main St', 'Islamabad', 'Federal', '44000', 'PK');

-- Insert Departments
INSERT INTO department (dept_name, budget) VALUES 
('Cardiology', 500000.00),
('Orthopedics', 450000.00),
('Neurology', 480000.00),
('General Medicine', 420000.00),
('Pediatrics', 380000.00),
('Surgery', 600000.00);

-- Insert Wards
INSERT INTO ward (ward_name, capacity, dept_id) VALUES 
('Cardiology Ward A', 20, 1),
('Cardiology Ward B', 15, 1),
('Orthopedics Ward', 25, 2),
('Neurology Ward', 18, 3),
('General Ward', 30, 4),
('Pediatric Ward', 20, 5),
('Surgery Ward', 22, 6);

-- Insert Medicines
INSERT INTO medicine (m_name, price, quantity, usage_of_mediciene) VALUES 
('Aspirin', 50.00, 500, 'Take 1 tablet twice daily'),
('Paracetamol', 40.00, 600, 'Take 1 tablet every 6 hours'),
('Amoxicillin', 150.00, 300, 'Take 1 tablet three times daily'),
('Metformin', 60.00, 400, 'Take 1 tablet daily'),
('Atorvastatin', 120.00, 250, 'Take 1 tablet daily'),
('Lisinopril', 100.00, 280, 'Take 1 tablet daily'),
('Omeprazole', 80.00, 350, 'Take 1 tablet daily before breakfast');
```

### Step 2: Insert Staff Members

Insert initial staff members:

```sql
-- Insert Staff Member (Doctor)
INSERT INTO staff (s_name, Roll_r_id, Department_dept_id, Shift_shift_id, CNIC, ph_number, Gender, join_date, Address_id) 
VALUES ('Dr. Ahmed Ali', 1, 1, 1, '12345-6789012-3', '03001234567', 'Male', '2023-01-15', 1);

-- Insert Staff Member (Nurse)
INSERT INTO staff (s_name, Roll_r_id, Department_dept_id, Shift_shift_id, CNIC, ph_number, Gender, join_date, Address_id) 
VALUES ('Fatima Khan', 2, 1, 1, '98765-4321098-7', '03009876543', 'Female', '2023-02-20', 1);

-- Insert Staff Member (Receptionist)
INSERT INTO staff (s_name, Roll_r_id, Department_dept_id, Shift_shift_id, CNIC, ph_number, Gender, join_date, Address_id) 
VALUES ('Hassan Malik', 3, 4, 1, '11111-1111111-1', '03005555555', 'Male', '2023-03-10', 1);

-- Insert Staff Member (Admin)
INSERT INTO staff (s_name, Roll_r_id, Department_dept_id, Shift_shift_id, CNIC, ph_number, Gender, join_date, Address_id) 
VALUES ('Ali Hassan', 4, 4, 1, '22222-2222222-2', '03006666666', 'Male', '2023-01-01', 1);

-- Get the staff IDs (check the IDs of inserted staff)
SELECT s_id, s_name FROM staff;
```

**Note:** Keep the staff IDs for the next step. They will be used to insert user logins.

### Step 3: Insert Doctor Records

After getting staff IDs, insert doctor records:

```sql
-- Insert Doctor (replace 1 with actual staff_id from above)
INSERT INTO doctor (d_name, Staff_s_id, Department_dept_id) 
VALUES ('Dr. Ahmed Ali', 1, 1);

-- Insert Nurse (replace 2 with actual staff_id from above)
INSERT INTO nurse (n_name, Staff_s_id) 
VALUES ('Fatima Khan', 2);

-- Insert Receptionist (replace 3 with actual staff_id from above)
INSERT INTO receptionist (rec_name, Staff_s_id) 
VALUES ('Hassan Malik', 3);

-- Insert Admin (replace 4 with actual staff_id from above)
INSERT INTO admin (admin_name, Staff_s_id) 
VALUES ('Ali Hassan', 4);
```

### Step 4: Insert Doctor Fees

```sql
-- Insert doctor consultation fees (replace 1 with actual doctor_id)
INSERT INTO doctor_fee (d_id, base_fee, followup_fee) 
VALUES (1, 1500.00, 1000.00);
```

### Step 5: Insert User Login Credentials

**Important:** Insert user login records for all staff members:

```sql
-- Doctor Login (replace 1 with actual staff_id)
INSERT INTO userlogin (username, password, staff_id) 
VALUES ('doctor_ahmed', 'password123', 1);

-- Nurse Login (replace 2 with actual staff_id)
INSERT INTO userlogin (username, password, staff_id) 
VALUES ('nurse_fatima', 'password123', 2);

-- Receptionist Login (replace 3 with actual staff_id)
INSERT INTO userlogin (username, password, staff_id) 
VALUES ('receptionist_hassan', 'password123', 3);

-- Admin Login (replace 4 with actual staff_id)
INSERT INTO userlogin (username, password, staff_id) 
VALUES ('admin_ali', 'password123', 4);
```

### Step 6: Insert Sample Patient Data

```sql
-- Insert Sample Patient
INSERT INTO patient (p_name, phone_no, CNIC, gender, Blood_Group, Relative_name, department, age, weight) 
VALUES ('Muhammad Hassan', '03001234567', '12345-6789012-5', 'Male', 'O+', 'Ayesha Hassan', 1, 35, 75.50);

-- Insert Patient User Login
INSERT INTO userlogin (username, password, p_id) 
VALUES ('patient_hassan', 'password123', 1);
```

### Step 7: Verify Data Insertion

```sql
-- Verify Staff
SELECT * FROM staff;

-- Verify Doctors
SELECT * FROM doctor;

-- Verify User Logins
SELECT * FROM userlogin;

-- Verify Patients
SELECT * FROM patient;
```

---

## Running the Application

### Step 1: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
Connected to MySQL database
Server running on port 5000
```

### Step 2: Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm start
```

This will open the application in your default browser at `http://localhost:3000`

---

## Login Credentials

Use these credentials to log in after initial setup:

### Doctor
- **Username:** `doctor_ahmed`
- **Password:** `password123`

### Nurse
- **Username:** `nurse_fatima`
- **Password:** `password123`

### Receptionist
- **Username:** `receptionist_hassan`
- **Password:** `password123`

### Admin
- **Username:** `admin_ali`
- **Password:** `password123`

### Patient
- **Username:** `patient_hassan`
- **Password:** `password123`

---

## Project Structure

```
Hospital-Management-System/
├── backend/
│   ├── index.js                 # Main server file
│   ├── package.json             # Backend dependencies
│   ├── .env                     # Environment variables
│   └── routes/                  # API routes
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── index.js            # React entry point
│   │   ├── App.js              # Main App component
│   │   ├── App.css             # App styles
│   │   ├── LoginPage.js        # Login component
│   │   ├── AdminDashboardPage.js
│   │   ├── DoctorDashboardPage.js
│   │   ├── PatientDashboard.js
│   │   ├── ReceptionistAdmissionPage.js
│   │   ├── ReceptionistAppointmentPage.js
│   │   ├── ReceptionistBillingPage.js
│   │   ├── components/         # Reusable components
│   │   └── ...                 # Other pages and components
│   └── package.json            # Frontend dependencies
├── hospital_management_schema.sql  # Database schema
└── README.md                       # This file
```

---

## User Roles

### **Admin**
- Full system control
- Manage staff and departments
- View reports and analytics
- Configure system settings

### **Doctor**
- View patient appointments
- Write prescriptions
- Update patient medical records
- Manage clinical timings

### **Receptionist**
- Schedule appointments
- Process patient admissions/discharges
- Generate billing invoices
- Manage patient registrations

### **Nurse**
- View ward assignments
- Monitor patient vitals
- Record medication administration
- Assist with patient care

### **Patient**
- View personal health records
- Schedule appointments
- View prescription history
- Check billing information

---

## API Endpoints

The backend provides RESTful API endpoints. Key endpoints include:

- **Authentication:** `/api/auth/login`
- **Patients:** `/api/patients`
- **Doctors:** `/api/doctors`
- **Appointments:** `/api/appointments`
- **Admissions:** `/api/admissions`
- **Billing:** `/api/billing`

---

## Troubleshooting

### Issue: MySQL Connection Error
**Solution:** 
- Verify MySQL is running
- Check `.env` file has correct credentials
- Ensure database name matches in `.env`

### Issue: Frontend Won't Load
**Solution:**
- Clear browser cache (Ctrl + Shift + Delete)
- Restart frontend with `npm start`
- Check backend is running on port 5000

### Issue: Port Already in Use
**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux - Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Issue: Module Not Found
**Solution:**
```bash
# Reinstall dependencies
npm install
```

---

## Database Backup

To backup your database:

```bash
mysqldump -u root -p hospital_management > backup.sql
```

To restore:

```bash
mysql -u root -p hospital_management < backup.sql
```

---

## Security Notes

⚠️ **Important:**
- Change all default passwords in production
- Hash passwords using bcrypt before storing
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Use HTTPS in production

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues or questions, please open an issue on the GitHub repository.

---

## Acknowledgments

Built with ❤️ for healthcare management excellence
