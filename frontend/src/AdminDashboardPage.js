  import React, { useEffect, useMemo, useRef, useState } from 'react';
  import './Admin_staff.css'

  export default function AdminDashboardPage({ user }) {
    const API = 'http://localhost:5000';

    // UI state
    const [activeTab, setActiveTab] = useState('overview');
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState('');

    // Foreign key checks toggle
    const [fkChecks, setFkChecks] = useState(1);
    const fkLabel = useMemo(() => (fkChecks ? 'ON' : 'OFF'), [fkChecks]);

    // Data state
    const [counts, setCounts] = useState({
      departments: 0,
      doctors: 0,
      nurses: 0,
      receptionists: 0,
      interns: 0,
      staff: 0,
      feeRows: 0,
    });

    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [nurses, setNurses] = useState([]);
    const [receptionists, setReceptionists] = useState([]);
    const [interns, setInterns] = useState([]);
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [fees, setFees] = useState([]);
    const [shift, setShift] = useState([]);

    const [dailySales, setDailySales] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);

    // Add/Edit staff form
    const emptyStaffForm = {
      s_name: '',
      Roll_r_id: '', // role id
      Department_dept_id: '',
      Shift_shift_id: '',
      CNIC: '',
      ph_number: '',
      Gender: '',
      email: '',
      password: '',

    };
    const [staffForm, setStaffForm] = useState(emptyStaffForm);
    const [editingStaffId, setEditingStaffId] = useState(null);

    // Uncontrolled refs for staff form
    const sNameRef = useRef(null);
    const roleRef = useRef(null);
    const deptRef = useRef(null);
    const shiftRef = useRef(null);
    const cnicRef = useRef(null);
    const phoneRef = useRef(null);
    const genderRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);


    // Helpers
    const authHeaders = {
      role: 'admin',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Content-Type': 'application/json',
    };

    const safeFetch = async (url, options = {}) => {
      setError('');
      const res = await fetch(url, { headers: authHeaders, ...options });
      if (!res.ok) {
        let errText = 'Request failed';
        try { const d = await res.json(); errText = d.error || JSON.stringify(d); } catch { }
        throw new Error(errText);
      }
      return res.json();
    };

    // Initial load
    useEffect(() => {

      refreshOverview();
      preloadReferenceData();
    }, []);

    // Loaders
    const refreshOverview = async () => {
      try {
        setIsBusy(true);
        const [dept, doc, nur, rec, intn, stf, fee] = await Promise.all([
          safeFetch(`${API}/api/admin/departments`),
          safeFetch(`${API}/api/admin/doctors`),
          safeFetch(`${API}/api/admin/nurses`),
          safeFetch(`${API}/api/admin/receptionists`),
          safeFetch(`${API}/api/admin/interns`),
          safeFetch(`${API}/api/admin/staff`),
          safeFetch(`${API}/api/admin/fees`),
        ]);
        setDepartments(dept);
        setDoctors(doc);
        setNurses(nur);
        setReceptionists(rec);
        setInterns(intn);
        setStaff(stf);
        setFees(fee);
        setCounts({
          departments: dept.length,
          doctors: doc.length,
          nurses: nur.length,
          receptionists: rec.length,
          interns: intn.length,
          staff: stf.length,
          feeRows: fee.length,
        });
      } catch (e) {
        setError(`Failed to load overview: ${e.message}`);
      } finally {
        setIsBusy(false);
      }
    };

    const preloadReferenceData = async () => {
      try {
        const rolesData = await safeFetch(`${API}/api/admin/roles`);
        setRoles(rolesData);

        const shiftData = await safeFetch(`${API}/api/admin/shifts`);
        setShift(shiftData);

        console.log('Loaded roles:', rolesData);
        console.log('Loaded shifts:', shiftData);
      } catch (e) {
        console.error('Failed to preload reference data:', e.message);
      }
    };


    const loadDailySales = async () => {
      try {
        setIsBusy(true);
        const rows = await safeFetch(`${API}/api/admin/sales/daily`);
        setDailySales(rows);
      } catch (e) {
        setError(`Failed to load daily sales: ${e.message}`);
      } finally {
        setIsBusy(false);
      }
    };

    const loadMonthlySales = async () => {
      try {
        setIsBusy(true);
        const rows = await safeFetch(`${API}/api/admin/sales/monthly`);
        setMonthlySales(rows);
      } catch (e) {
        setError(`Failed to load monthly sales: ${e.message}`);
      } finally {
        setIsBusy(false);
      }
    };

    // Staff CRUD
    const submitStaff = async (e) => {
      e.preventDefault();
      try {
        setIsBusy(true);
        const payloadStaff = {
          s_name: sNameRef.current?.value || '',
          Roll_r_id: roleRef.current?.value || '',
          Department_dept_id: deptRef.current?.value || '',
          Shift_shift_id: shiftRef.current?.value || '',
          CNIC: cnicRef.current?.value || '',
          ph_number: phoneRef.current?.value || '',
          Gender: genderRef.current?.value || '',

        };
        const emailVal = emailRef.current?.value || '';
        const passwordVal = passwordRef.current?.value || '';

        if (editingStaffId) {
          await safeFetch(`${API}/api/admin/staff/${editingStaffId}`, {
            method: 'PUT',
            body: JSON.stringify(payloadStaff),
          });
        } else {
          const created = await safeFetch(`${API}/api/admin/staff`, {
            method: 'POST',
            body: JSON.stringify(payloadStaff),
          });
          if (emailVal && passwordVal) {
            await safeFetch(`${API}/api/admin/userlogin`, {
              method: 'POST',
              body: JSON.stringify({
                username: emailVal,
                password: passwordVal,
                staff_id: created.s_id,
                role: payloadStaff.Roll_r_id,
              }),
            });
          }
        }
        setStaffForm(emptyStaffForm);
        setEditingStaffId(null);
        await refreshOverview();
        alert('✅ Staff saved successfully');
      } catch (e) {
        if (e.message.toLowerCase().includes('foreign key')) {
          alert('❌ Foreign key constraint violation. Tip: toggle OFF foreign key checks, perform the operation, then turn it back ON.');
        } else {
          alert(`❌ Failed to save staff: ${e.message}`);
        }
      } finally {
        setIsBusy(false);
      }
    };

    const editStaff = (row) => {
      setEditingStaffId(row.s_id);
      setStaffForm({
        s_name: row.s_name || '',
        Roll_r_id: row.Roll_r_id || '',
        Department_dept_id: row.Department_dept_id || '',
        Shift_shift_id: row.Shift_shift_id || '',
        CNIC: row.CNIC || '',
        ph_number: row.ph_number || '',
        Gender: row.Gender || '',
        email: row.email || '',
        password: '',

      });
    };

    const deleteStaff = async (s_id) => {
      if (!window.confirm('Are you sure you want to delete this staff member?')) return;
      try {
        setIsBusy(true);
        await safeFetch(`${API}/api/admin/staff/${s_id}`, { method: 'DELETE' });
        await refreshOverview();
        alert('🗑️ Staff deleted');
      } catch (e) {
        if (e.message.toLowerCase().includes('foreign key')) {
          alert('❌ Cannot delete: foreign key constraint. Tip: toggle OFF foreign key checks, delete, then turn it back ON.');
        } else {
          alert(`❌ Failed to delete: ${e.message}`);
        }
      } finally {
        setIsBusy(false);
      }
    };

    // Toggle Foreign Key Checks
    const toggleFkChecks = async () => {
      try {
        const newValue = fkChecks ? 0 : 1;
        setIsBusy(true);
        await safeFetch(`${API}/api/admin/foreign-key-checks`, {
          method: 'POST',
          body: JSON.stringify({ value: newValue }),
        });
        setFkChecks(newValue);
        alert(`Foreign key checks set to ${newValue}`);
      } catch (e) {
        alert(`Failed to toggle foreign key checks: ${e.message}`);
      } finally {
        setIsBusy(false);
      }
    };

    // Renderers
    const renderCountCard = (label, value) => (
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{value}</div>
      </div>
    );

    const renderTable = (columns, rows, keyField) => (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {columns.map(col => (
                <th key={col.key} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row[keyField]}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                    {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );

    const StaffForm = () => (
      <form id="staff-form" key={editingStaffId || 'new'} onSubmit={submitStaff} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <div>
            <label>Name</label>
            <input ref={sNameRef} defaultValue={staffForm.s_name} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required />
          </div>
          <div>
            <label>Role</label>
            <select ref={roleRef} defaultValue={staffForm.Roll_r_id} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required>
              <option value="">Select role</option>
              {roles.map(r => (
                <option key={r.r_id || r.id} value={r.r_id || r.id}>{r.role || r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Department </label>
            <select ref={deptRef} defaultValue={staffForm.Department_dept_id} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required >
              <option value="">Select department</option>
              {departments.map(d => (
                <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Shift</label>
            <select ref={shiftRef} defaultValue={staffForm.Shift_shift_id} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required >
              <option value="">Select shift</option>
              {shift.map(s => (
                <option key={s.shift_id} value={s.shift_id}>  {s.shift_type} {s.start_time}-{s.end_time}</option>
              ))}
            </select>
          </div>
          <div>
            <label>CNIC</label>
            <input ref={cnicRef} defaultValue={staffForm.CNIC} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Phone</label>
            <input ref={phoneRef} defaultValue={staffForm.ph_number} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Gender</label>
            <select ref={genderRef} defaultValue={staffForm.Gender} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label>Email (username)</label>
            <input ref={emailRef} type="email" defaultValue={staffForm.email} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label>Password</label>
            <input ref={passwordRef} type="password" defaultValue={staffForm.password} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" style={{ background: '#10b981', color: 'white', padding: '8px 14px', border: 'none', borderRadius: 6 }} disabled={isBusy}>
            {editingStaffId ? 'Update Staff' : 'Add Staff'}
          </button>
          {editingStaffId && (
            <button type="button" onClick={() => { setEditingStaffId(null); setStaffForm(emptyStaffForm); }} style={{ background: '#6b7280', color: 'white', padding: '8px 14px', border: 'none', borderRadius: 6 }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    );

    const memoStaffForm = useMemo(() => <StaffForm />, [roles, shift, editingStaffId]);

    const StaffTable = () => {
      const columns = [
        { key: 's_id', label: 'ID' },
        { key: 's_name', label: 'Name' },
        { key: 'Roll_r_id', label: 'Role' },
        { key: 'Department_dept_id', label: 'Department' },
        { key: 'Shift_shift_id', label: 'Shift' },
        { key: 'ph_number', label: 'Phone' },
        { key: 'Gender', label: 'Gender' },
        {
          key: 'actions',
          label: 'Actions',
          render: (_v, row) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => editStaff(row)}
                style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 6 }}
              >
                Edit
              </button>
              <button
                onClick={() => deleteStaff(row.s_id)}
                style={{ background: '#ef4444', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 6 }}
              >
                Delete
              </button>
            </div>
          ),
        },
      ];

      return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {/* TABLE HEADER */}
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {staff.map(row => (
              <tr key={row.s_id}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{ padding: '8px', borderBottom: '1px solid #eee' }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    };


    const SimpleTable = ({ rows, keyField }) => {
      if (!rows || rows.length === 0) return <div style={{ color: '#6b7280' }}>No data</div>;
      const columns = Object.keys(rows[0]).map(k => ({ key: k, label: k }));
      return renderTable(columns, rows, keyField);
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Foreign Key Checks:</span>
            <button onClick={toggleFkChecks} style={{ background: fkChecks ? '#10b981' : '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 999 }}>
              {fkLabel}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['overview', 'staff', 'departments', 'doctors', 'nurses', 'receptionists', 'interns', 'fees', 'roles', 'sales'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: activeTab === tab ? '#111827' : '#fff', color: activeTab === tab ? '#fff' : '#111' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button onClick={refreshOverview} style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Refresh</button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: 8, borderRadius: 6, marginBottom: 12 }}>{error}</div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            {renderCountCard('Departments', counts.departments)}
            {renderCountCard('Doctors', counts.doctors)}
            {renderCountCard('Nurses', counts.nurses)}
            {renderCountCard('Receptionists', counts.receptionists)}
            {renderCountCard('Interns', counts.interns)}
            {renderCountCard('Total Staff', counts.staff)}
            {renderCountCard('Fee Rows', counts.feeRows)}
          </div>
        )}

        {activeTab === 'staff' && (
          <>
            {memoStaffForm}


            <div className='staff'>
              <StaffTable />
            </div>
          </>
        )

        }

        {
          activeTab === 'departments' && (
            <SimpleTable rows={departments} keyField={Object.keys(departments[0] || { id: 'id' })[0]} />
          )
        }
        {
          activeTab === 'doctors' && (
            <SimpleTable rows={doctors} keyField={Object.keys(doctors[0] || { id: 'id' })[0]} />
          )
        }
        {
          activeTab === 'nurses' && (
            <SimpleTable rows={nurses} keyField={Object.keys(nurses[0] || { id: 'id' })[0]} />
          )
        }
        {
          activeTab === 'receptionists' && (
            <SimpleTable rows={receptionists} keyField={Object.keys(receptionists[0] || { id: 'id' })[0]} />
          )
        }
        {
          activeTab === 'interns' && (
            <SimpleTable rows={interns} keyField={Object.keys(interns[0] || { id: 'id' })[0]} />
          )
        }
        {
          activeTab === 'fees' && (
            <SimpleTable rows={fees} keyField={Object.keys(fees[0] || { fee_id: 'fee_id' })[0]} />
          )
        }
        {
          activeTab === 'roles' && (
            <SimpleTable rows={roles} keyField={Object.keys(roles[0] || { r_id: 'r_id' })[0]} />
          )
        }

        {
          activeTab === 'sales' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={loadDailySales} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Daily Sales</button>
                <button onClick={loadMonthlySales} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Monthly Sales</button>
              </div>
              <h3>Daily Sales</h3>
              <SimpleTable rows={dailySales} keyField={Object.keys(dailySales[0] || { id: 'id' })[0]} />
              <h3 style={{ marginTop: 16 }}>Monthly Sales</h3>
              <SimpleTable rows={monthlySales} keyField={Object.keys(monthlySales[0] || { id: 'id' })[0]} />
            </div>
          )
        }

        {isBusy && <div style={{ marginTop: 12, color: '#6b7280' }}>Loading...</div>}
      </div >
    );
  }

