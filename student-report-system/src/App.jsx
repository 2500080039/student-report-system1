import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  LayoutDashboard, Users, FileText, Settings,
  LogOut, Plus, Search, Trash2, Edit, Download
} from "lucide-react";
import "./App.css";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "English",
  "Environmental Science"
];

const initialUsers = [
  {
    id: 1,
    name: "Administrator",
    username: "admin",
    password: "admin123",
    role: "admin",
    email: "admin@example.com"
  },
  {
    id: 2,
    name: "Student One",
    username: "student1",
    password: "stu123",
    role: "student",
    email: "student@example.com"
  },
  {
    id: 3,
    name: "Parent One",
    username: "parent1",
    password: "par123",
    role: "parent",
    email: "parent@example.com",
    studentId: 2
  }
];

const initialReports = [
  {
    id: 1,
    studentId: 2,
    studentName: "Student One",
    marks: {
      Mathematics: 85,
      Physics: 78,
      Chemistry: 90,
      "Computer Science": 95,
      English: 82,
      "Environmental Science": 88
    },
    attendance: 92,
    remarks: "Excellent performance"
  }
];

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function App() {
  const [users, setUsers] = useState(() =>
    JSON.parse(localStorage.getItem("srs_users")) || initialUsers
  );

  const [reports, setReports] = useState(() =>
    JSON.parse(localStorage.getItem("srs_reports")) || initialReports
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const [reportForm, setReportForm] = useState({
    studentId: "",
    marks: Object.fromEntries(SUBJECTS.map(s => [s, ""])),
    attendance: "",
    remarks: ""
  });

  const [accountForm, setAccountForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "student",
    studentId: ""
  });

  useEffect(() => {
    localStorage.setItem("srs_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("srs_reports", JSON.stringify(reports));
  }, [reports]);

  const students = users.filter(user => user.role === "student");

  const visibleReports = reports.filter(report => {
    if (currentUser?.role === "student") {
      return report.studentId === currentUser.id;
    }

    if (currentUser?.role === "parent") {
      return report.studentId === currentUser.studentId;
    }

    return true;
  });

  const totalMarks = report =>
    Object.values(report.marks).reduce(
      (sum, mark) => sum + Number(mark || 0), 0
    );

  const percentage = report =>
    totalMarks(report) / SUBJECTS.length;

  const login = event => {
    event.preventDefault();

    const foundUser = users.find(
      user =>
        user.username === username &&
        user.password === password
    );

    if (!foundUser) {
      setLoginError("Invalid username or password");
      return;
    }

    setCurrentUser(foundUser);
    setActivePage("dashboard");
    setLoginError("");
  };

  const logout = () => {
    setCurrentUser(null);
    setUsername("");
    setPassword("");
    setActivePage("dashboard");
  };

  const resetReportForm = () => {
    setReportForm({
      studentId: "",
      marks: Object.fromEntries(SUBJECTS.map(s => [s, ""])),
      attendance: "",
      remarks: ""
    });
    setEditingReport(null);
    setShowReportForm(false);
  };

  const saveReport = event => {
    event.preventDefault();

    const student = students.find(
      s => s.id === Number(reportForm.studentId)
    );

    if (!student) {
      alert("Please select a student");
      return;
    }

    const marks = {};

    for (const subject of SUBJECTS) {
      const mark = Number(reportForm.marks[subject]);

      if (
        reportForm.marks[subject] === "" ||
        !Number.isFinite(mark) ||
        mark < 0 ||
        mark > 100
      ) {
        alert(`Enter valid marks for ${subject} (0–100)`);
        return;
      }

      marks[subject] = mark;
    }

    const attendance = Number(reportForm.attendance);

    if (
      reportForm.attendance === "" ||
      !Number.isFinite(attendance) ||
      attendance < 0 ||
      attendance > 100
    ) {
      alert("Attendance must be between 0 and 100");
      return;
    }

    const newReport = {
      id: editingReport ? editingReport.id : Date.now(),
      studentId: student.id,
      studentName: student.name,
      marks,
      attendance,
      remarks: reportForm.remarks
    };

    if (editingReport) {
      setReports(old =>
        old.map(r => r.id === editingReport.id ? newReport : r)
      );
    } else {
      setReports(old => [...old, newReport]);
    }

    resetReportForm();
  };

  const editReport = report => {
    setEditingReport(report);

    setReportForm({
      studentId: String(report.studentId),
      marks: { ...report.marks },
      attendance: String(report.attendance),
      remarks: report.remarks
    });

    setShowReportForm(true);
  };

  const deleteReport = id => {
    if (window.confirm("Delete this report?")) {
      setReports(old => old.filter(r => r.id !== id));
    }
  };

  const createAccount = event => {
    event.preventDefault();

    const cleanUsername = accountForm.username.trim();
    const cleanEmail = accountForm.email.trim();

    if (
      users.some(
        u =>
          u.username.toLowerCase() === cleanUsername.toLowerCase() ||
          u.email.toLowerCase() === cleanEmail.toLowerCase()
      )
    ) {
      alert("Username or email already exists");
      return;
    }

    if (accountForm.password.length < 6) {
      alert("Password must contain at least 6 characters");
      return;
    }

    if (
      accountForm.role === "parent" &&
      !accountForm.studentId
    ) {
      alert("Please select a student for this parent");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: accountForm.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: accountForm.password,
      role: accountForm.role,
      studentId:
        accountForm.role === "parent"
          ? Number(accountForm.studentId)
          : null
    };

    setUsers(old => [...old, newUser]);

    setAccountForm({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "student",
      studentId: ""
    });

    alert("Account created successfully");
  };

  const downloadCSV = report => {
    const rows = [
      ["Student Report"],
      ["Student Name", report.studentName],
      ["Attendance", `${report.attendance}%`],
      ["Subject", "Marks"],
      ...SUBJECTS.map(s => [s, report.marks[s]]),
      ["Total", totalMarks(report)],
      ["Percentage", `${percentage(report).toFixed(2)}%`],
      ["Grade", getGrade(percentage(report))],
      ["Remarks", report.remarks]
    ];

    const csv = rows
      .map(row =>
        row.map(value =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${report.studentName}-report.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon">📚</div>
          <h1>Student Report System</h1>
          <p>Login to access your dashboard</p>

          <form onSubmit={login}>
            <label>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            {loginError && (
              <p className="error-message">{loginError}</p>
            )}

            <button className="primary-btn" type="submit">
              Login
            </button>
          </form>

          <div className="demo-login">
            <strong>Demo Admin:</strong> admin / admin123
          </div>
        </div>
      </div>
    );
  }

  const filteredReports = visibleReports.filter(report =>
    report.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = visibleReports.map(report => ({
    name: report.studentName,
    percentage: Number(percentage(report).toFixed(1))
  }));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span>📚</span>
          <h2>Student Reports</h2>
        </div>

        <div className="user-info">
          <div className="avatar">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.role}</small>
          </div>
        </div>

        <nav>
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => setActivePage("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button
            className={activePage === "reports" ? "active" : ""}
            onClick={() => setActivePage("reports")}
          >
            <FileText size={18} /> Reports
          </button>

          {currentUser.role === "admin" && (
            <>
              <button
                className={activePage === "students" ? "active" : ""}
                onClick={() => setActivePage("students")}
              >
                <Users size={18} /> Students
              </button>

              <button
                className={activePage === "accounts" ? "active" : ""}
                onClick={() => setActivePage("accounts")}
              >
                <Users size={18} /> Accounts
              </button>

              <button
                className={activePage === "settings" ? "active" : ""}
                onClick={() => setActivePage("settings")}
              >
                <Settings size={18} /> Settings
              </button>
            </>
          )}
        </nav>

        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "reports"
                ? "Student Reports"
                : activePage === "students"
                ? "Students"
                : activePage === "accounts"
                ? "Manage Accounts"
                : "Settings"}
            </h1>
            <p>Welcome back, {currentUser.name}</p>
          </div>
          <span className="role-label">{currentUser.role}</span>
        </header>

        {activePage === "dashboard" && (
          <>
            <section className="stats-grid">
              <div className="stat-card purple">
                <span>Total Students</span>
                <h2>{students.length}</h2>
                <Users />
              </div>

              <div className="stat-card blue">
                <span>Total Reports</span>
                <h2>{visibleReports.length}</h2>
                <FileText />
              </div>

              <div className="stat-card green">
                <span>Average Percentage</span>
                <h2>
                  {visibleReports.length
                    ? (
                        visibleReports.reduce(
                          (sum, r) => sum + percentage(r), 0
                        ) / visibleReports.length
                      ).toFixed(1) + "%"
                    : "0%"}
                </h2>
              </div>

              <div className="stat-card orange">
                <span>Accounts</span>
                <h2>{users.length}</h2>
                <Users />
              </div>
            </section>

            <section className="panel">
              <h2>Student Performance</h2>

              {chartData.length ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar
                        dataKey="percentage"
                        fill="#7357e8"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>No reports available yet.</p>
              )}
            </section>
          </>
        )}

        {activePage === "reports" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Reports</h2>

              {currentUser.role === "admin" && (
                <button
                  className="primary-btn small"
                  onClick={() => {
                    setEditingReport(null);
                    setReportForm({
                      studentId: "",
                      marks: Object.fromEntries(
                        SUBJECTS.map(s => [s, ""])
                      ),
                      attendance: "",
                      remarks: ""
                    });
                    setShowReportForm(true);
                  }}
                >
                  <Plus size={17} /> Add Report
                </button>
              )}
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                placeholder="Search student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {showReportForm && currentUser.role === "admin" && (
              <form className="report-form" onSubmit={saveReport}>
                <h3>
                  {editingReport ? "Edit Report" : "Create Report"}
                </h3>

                <label>Select Student</label>
                <select
                  value={reportForm.studentId}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      studentId: e.target.value
                    })
                  }
                  required
                >
                  <option value="">Select student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>

                <h3>Subject Marks (out of 100)</h3>

                <div className="marks-grid">
                  {SUBJECTS.map(subject => (
                    <div key={subject}>
                      <label>{subject}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={reportForm.marks[subject]}
                        onChange={e =>
                          setReportForm({
                            ...reportForm,
                            marks: {
                              ...reportForm.marks,
                              [subject]: e.target.value
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <label>Attendance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={reportForm.attendance}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      attendance: e.target.value
                    })
                  }
                />

                <label>Remarks</label>
                <textarea
                  value={reportForm.remarks}
                  onChange={e =>
                    setReportForm({
                      ...reportForm,
                      remarks: e.target.value
                    })
                  }
                  placeholder="Enter remarks"
                />

                <div className="form-actions">
                  <button className="primary-btn" type="submit">
                    Save Report
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={resetReportForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id}>
                      <td>{report.studentName}</td>
                      <td>{totalMarks(report)} / 600</td>
                      <td>{percentage(report).toFixed(2)}%</td>
                      <td>
                        <span className="grade">
                          {getGrade(percentage(report))}
                        </span>
                      </td>
                      <td>{report.attendance}%</td>
                      <td className="actions">
                        <button
                          title="Download CSV"
                          onClick={() => downloadCSV(report)}
                        >
                          <Download size={17} />
                        </button>

                        {currentUser.role === "admin" && (
                          <>
                            <button
                              title="Edit"
                              onClick={() => editReport(report)}
                            >
                              <Edit size={17} />
                            </button>

                            <button
                              title="Delete"
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan="6">No reports found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "students" && currentUser.role === "admin" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Students</h2>
              <span>{students.length} student(s)</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Username</th><th>Email</th></tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.username}</td>
                      <td>{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "accounts" && currentUser.role === "admin" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Create Account</h2>
            </div>
            <form className="account-form" onSubmit={createAccount}>
              <input
                placeholder="Full name"
                value={accountForm.name}
                onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Username"
                value={accountForm.username}
                onChange={e => setAccountForm({ ...accountForm, username: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={accountForm.email}
                onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={accountForm.password}
                onChange={e => setAccountForm({ ...accountForm, password: e.target.value })}
                required
              />
              <select
                value={accountForm.role}
                onChange={e => setAccountForm({ ...accountForm, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
              {accountForm.role === "parent" && (
                <select
                  value={accountForm.studentId}
                  onChange={e => setAccountForm({ ...accountForm, studentId: e.target.value })}
                  required
                >
                  <option value="">Select student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              )}
              <button className="primary-btn" type="submit">Create Account</button>
            </form>
          </section>
        )}

        {activePage === "settings" && currentUser.role === "admin" && (
          <section className="panel">
            <h2>Settings</h2>
            <p>Manage your student report system settings.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;