import { useEffect, useMemo, useState } from "react";
import "./App.css";

const SUBJECTS = ["FED", "AIML", "OS", "IOT", "OOP", "MATHS"];
const STORAGE_KEY = "student-report-system-v1";

const DEMO_STUDENTS = [
  {
    id: "demo-1",
    name: "Hari Bonthu",
    roll: "2500080039",
    studentUsername: "hari",
    studentPassword: "1234",
    parentUsername: "hari_parent",
    parentPassword: "1234",
    marks: { FED: 88, AIML: 92, OS: 81, IOT: 90, OOP: 86, MATHS: 84 },
    attendance: 92,
    remarks: "Excellent progress. Keep practising and stay consistent.",
  },
  {
    id: "demo-2",
    name: "Aarav Kumar",
    roll: "2500080040",
    studentUsername: "aarav",
    studentPassword: "1234",
    parentUsername: "aarav_parent",
    parentPassword: "1234",
    marks: { FED: 76, AIML: 82, OS: 78, IOT: 85, OOP: 80, MATHS: 74 },
    attendance: 86,
    remarks: "Good effort. Focus a little more on Mathematics and OS.",
  },
];

function readStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEMO_STUDENTS;
  } catch {
    return DEMO_STUDENTS;
  }
}

function getTotal(marks = {}) {
  return SUBJECTS.reduce((sum, subject) => sum + Number(marks[subject] || 0), 0);
}

function getPercentage(marks = {}) {
  return Math.round((getTotal(marks) / (SUBJECTS.length * 100)) * 100);
}

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "Needs support";
}

function App() {
  const [students, setStudents] = useState(readStudents);
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState("add");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    roll: "",
    studentUsername: "",
    studentPassword: "",
    parentUsername: "",
    parentPassword: "",
    marks: Object.fromEntries(SUBJECTS.map((subject) => [subject, ""])),
    attendance: "",
    remarks: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      [student.name, student.roll, student.studentUsername]
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [students, search]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateMark = (subject, value) => {
    setForm((previous) => ({
      ...previous,
      marks: { ...previous.marks, [subject]: value },
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      roll: "",
      studentUsername: "",
      studentPassword: "",
      parentUsername: "",
      parentPassword: "",
      marks: Object.fromEntries(SUBJECTS.map((subject) => [subject, ""])),
      attendance: "",
      remarks: "",
    });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setLoginError("");
    const cleanUser = username.trim().toLowerCase();

    if (role === "admin") {
      if (cleanUser === "admin" && password === "admin123") {
        setPage("admin");
        setNotice("Welcome back, Admin!");
      } else {
        setLoginError("Invalid admin username or password.");
      }
      return;
    }

    const student = students.find((item) =>
      role === "student"
        ? item.studentUsername.toLowerCase() === cleanUser && item.studentPassword === password
        : item.parentUsername.toLowerCase() === cleanUser && item.parentPassword === password
    );

    if (student) {
      setCurrentStudent(student);
      setPage(role);
      setNotice("");
    } else {
      setLoginError(`No ${role} account found. Check your login details.`);
    }
  };

  const handleSaveStudent = (event) => {
    event.preventDefault();
    setNotice("");

    if (!form.name.trim() || !form.roll.trim() || !form.studentUsername.trim() ||
        !form.studentPassword || !form.parentUsername.trim() || !form.parentPassword) {
      setNotice("Please complete all student and parent account fields.");
      return;
    }

    const marks = {};
    for (const subject of SUBJECTS) {
      const value = Number(form.marks[subject]);
      if (form.marks[subject] === "" || !Number.isFinite(value) || value < 0 || value > 100) {
        setNotice(`Enter valid marks from 0 to 100 for ${subject}.`);
        return;
      }
      marks[subject] = value;
    }

    const attendance = Number(form.attendance);
    if (form.attendance === "" || attendance < 0 || attendance > 100) {
      setNotice("Attendance must be between 0 and 100.");
      return;
    }

    const duplicate = students.some((student) =>
      student.id !== editingId &&
      (student.roll.toLowerCase() === form.roll.trim().toLowerCase() ||
       student.studentUsername.toLowerCase() === form.studentUsername.trim().toLowerCase() ||
       student.parentUsername.toLowerCase() === form.parentUsername.trim().toLowerCase())
    );
    if (duplicate) {
      setNotice("Roll number or username already exists. Use unique details.");
      return;
    }

    const record = {
      id: editingId || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
      name: form.name.trim(),
      roll: form.roll.trim(),
      studentUsername: form.studentUsername.trim(),
      studentPassword: form.studentPassword,
      parentUsername: form.parentUsername.trim(),
      parentPassword: form.parentPassword,
      marks,
      attendance,
      remarks: form.remarks.trim(),
    };

    setStudents((previous) =>
      editingId
        ? previous.map((student) => student.id === editingId ? record : student)
        : [record, ...previous]
    );
    setNotice(editingId ? "Student report updated successfully." : "Student report saved successfully.");
    resetForm();
    setActiveAdminTab("list");
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      roll: student.roll,
      studentUsername: student.studentUsername,
      studentPassword: student.studentPassword,
      parentUsername: student.parentUsername,
      parentPassword: student.parentPassword,
      marks: Object.fromEntries(SUBJECTS.map((subject) => [subject, student.marks[subject] ?? 0])),
      attendance: student.attendance,
      remarks: student.remarks || "",
    });
    setActiveAdminTab("add");
    setNotice("Editing student report. Update the details and save.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    const student = students.find((item) => item.id === id);
    if (!student) return;
    if (window.confirm(`Delete the report for ${student.name}?`)) {
      setStudents((previous) => previous.filter((item) => item.id !== id));
      setNotice("Student report deleted.");
      if (editingId === id) resetForm();
    }
  };

  const logout = () => {
    setCurrentStudent(null);
    setUsername("");
    setPassword("");
    setLoginError("");
    setNotice("");
    setPage("home");
  };

  const resetDemoData = () => {
    if (window.confirm("Restore the original demo records? Your current records will be replaced.")) {
      setStudents(DEMO_STUDENTS);
      resetForm();
      setNotice("Demo records restored.");
    }
  };

  const openLogin = (selectedRole = "admin") => {
    setRole(selectedRole);
    setUsername("");
    setPassword("");
    setLoginError("");
    setPage("login");
  };

  const studentStats = currentStudent
    ? {
        total: getTotal(currentStudent.marks),
        percentage: getPercentage(currentStudent.marks),
        grade: getGrade(getPercentage(currentStudent.marks)),
      }
    : null;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button className="brand" onClick={() => setPage("home")} aria-label="Go to home">
          <span className="brand-mark">🎓</span>
          <span>
            <strong>Campus<span className="brand-accent">Pulse</span></strong>
            <small>STUDENT REPORT SYSTEM</small>
          </span>
        </button>
        <nav className="top-nav">
          {page === "home" ? (
            <>
              <a href="#features">Features</a>
              <a href="#subjects">Subjects</a>
              <button className="nav-login" onClick={() => openLogin("admin")}>Sign in <span>↗</span></button>
            </>
          ) : (
            <button className="nav-login" onClick={logout}>← Back to home</button>
          )}
        </nav>
      </header>

      {page === "home" && (
        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> SMART ACADEMIC MANAGEMENT</div>
              <h1>Every student.<br /><span>Every achievement.</span><br />One clear view.</h1>
              <p className="hero-description">
                A modern space to manage academic reports, track attendance,
                and celebrate student progress — all in one place.
              </p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => openLogin("admin")}>Explore dashboard <span>→</span></button>
                <a className="text-link" href="#features">Discover features <span>↓</span></a>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack"><span>👩🏻‍🎓</span><span>👨🏽‍🎓</span><span>👨🏻‍🏫</span></div>
                <p><strong>One connected campus</strong><br />Admin · Students · Parents</p>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-orbit orbit-a" />
              <div className="visual-orbit orbit-b" />
              <div className="floating-chip chip-top">✦ Progress matters</div>
              <div className="preview-card">
                <div className="preview-top"><span className="preview-icon">📊</span><span className="live-label"><i /> LIVE OVERVIEW</span></div>
                <p className="preview-muted">Academic performance</p>
                <div className="preview-number">86.8<span>%</span></div>
                <div className="progress-track"><div className="progress-fill" /></div>
                <div className="preview-bottom"><span>Overall average</span><strong>↗ 12.4%</strong></div>
                <div className="mini-bars">
                  {[48, 72, 58, 88, 68, 96, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
                </div>
                <div className="preview-caption">Consistent effort creates great results.</div>
              </div>
              <div className="floating-chip chip-bottom"><span>🏆</span> Keep growing!</div>
              <div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✧</div>
            </div>
          </section>

          <section className="stats-strip">
            <div><strong>03</strong><span>Access roles</span></div>
            <div><strong>06</strong><span>Core subjects</span></div>
            <div><strong>100%</strong><span>Progress visibility</span></div>
            <div><strong>24/7</strong><span>Report access</span></div>
          </section>

          <section className="section-block" id="features">
            <div className="section-heading">
              <span className="section-kicker">BUILT FOR EVERYONE</span>
              <h2>One platform. <span>Three perspectives.</span></h2>
              <p>Helpful tools for the people who make learning successful.</p>
            </div>
            <div className="role-grid">
              <article className="role-card role-admin">
                <div className="role-icon">🧑‍💼</div><span className="card-number">01 / ADMIN</span>
                <h3>Manage with clarity</h3>
                <p>Add student profiles, update subject marks, maintain attendance, and share teacher remarks.</p>
                <button onClick={() => openLogin("admin")}>Admin sign in <span>↗</span></button>
              </article>
              <article className="role-card role-student">
                <div className="role-icon">🎓</div><span className="card-number">02 / STUDENT</span>
                <h3>Own your progress</h3>
                <p>View subject-wise scores, total marks, percentage, grade, attendance, and feedback.</p>
                <button onClick={() => openLogin("student")}>Student sign in <span>↗</span></button>
              </article>
              <article className="role-card role-parent">
                <div className="role-icon">👨‍👩‍👧</div><span className="card-number">03 / PARENT</span>
                <h3>Stay connected</h3>
                <p>Follow your child's academic performance and attendance with a simple report.</p>
                <button onClick={() => openLogin("parent")}>Parent sign in <span>↗</span></button>
              </article>
            </div>
          </section>

          <section className="subjects-section section-block" id="subjects">
            <div className="section-heading">
              <span className="section-kicker">LEARNING AT A GLANCE</span>
              <h2>Your subjects, <span>all together.</span></h2>
              <p>Track performance across the six core subjects.</p>
            </div>
            <div className="subject-pills">
              {SUBJECTS.map((subject, index) => <div className={`subject-pill subject-${index}`} key={subject}><span>{["💻", "🤖", "🖥️", "🔌", "☕", "📐"][index]}</span>{subject}</div>)}
            </div>
          </section>
        </main>
      )}

      {page === "login" && (
        <main className="login-page">
          <div className="login-decoration decoration-left">✦</div>
          <div className="login-card">
            <div className="login-logo">🔐</div>
            <span className="section-kicker">WELCOME BACK</span>
            <h1>Sign in to <span>CampusPulse</span></h1>
            <p className="login-subtitle">Choose your account type and enter your details.</p>
            <div className="role-switch">
              {["admin", "student", "parent"].map((item) => (
                <button key={item} className={role === item ? "selected" : ""} onClick={() => { setRole(item); setLoginError(""); }}>
                  {item === "admin" ? "🧑‍💼" : item === "student" ? "🎓" : "👨‍👩‍👧"} <span>{item}</span>
                </button>
              ))}
            </div>
            <form onSubmit={handleLogin}>
              <label htmlFor="login-username">Username</label>
              <input id="login-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" autoComplete="username" required />
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              {loginError && <div className="message error-message">{loginError}</div>}
              <button className="primary-button full-button" type="submit">Sign in securely <span>→</span></button>
            </form>
            <div className="demo-hint">
              <strong>Demo accounts</strong>
              <span>Admin: <b>admin</b> / <b>admin123</b></span>
              <span>Student: <b>hari</b> / <b>1234</b></span>
              <span>Parent: <b>hari_parent</b> / <b>1234</b></span>
            </div>
            <button className="back-home" onClick={() => setPage("home")}>← Return to home</button>
          </div>
          <div className="login-decoration decoration-right">✧</div>
        </main>
      )}

      {page === "admin" && (
        <main className="dashboard-page">
          <div className="dashboard-welcome">
            <div><span className="section-kicker">CONTROL CENTER</span><h1>Admin <span>Dashboard</span></h1><p>Manage student records and academic performance.</p></div>
            <button className="logout-button" onClick={logout}>↪ Log out</button>
          </div>
          <div className="dashboard-stats">
            <div className="metric-card metric-purple"><span>👩‍🎓</span><small>Total students</small><strong>{students.length}</strong><em>Registered records</em></div>
            <div className="metric-card metric-blue"><span>📈</span><small>Average percentage</small><strong>{students.length ? Math.round(students.reduce((sum, item) => sum + getPercentage(item.marks), 0) / students.length) : 0}%</strong><em>Across all students</em></div>
            <div className="metric-card metric-orange"><span>📅</span><small>Average attendance</small><strong>{students.length ? Math.round(students.reduce((sum, item) => sum + Number(item.attendance), 0) / students.length) : 0}%</strong><em>Attendance overview</em></div>
          </div>

          <div className="admin-workspace">
            <aside className="dashboard-sidebar">
              <span className="sidebar-label">WORKSPACE</span>
              <button className={activeAdminTab === "add" ? "active" : ""} onClick={() => { setActiveAdminTab("add"); setNotice(""); }}>＋ <span>{editingId ? "Edit report" : "Add student"}</span></button>
              <button className={activeAdminTab === "list" ? "active" : ""} onClick={() => { setActiveAdminTab("list"); setNotice(""); }}>▤ <span>Student records</span></button>
              <div className="sidebar-tip"><span>💡</span><strong>Quick tip</strong><p>Keep marks and attendance updated so students and parents can see the latest report.</p></div>
            </aside>

            <section className="workspace-content">
              {activeAdminTab === "add" ? (
                <div className="panel-card">
                  <div className="panel-heading"><div><span className="section-kicker">STUDENT INFORMATION</span><h2>{editingId ? "Update student report" : "Create a student report"}</h2><p>Enter account details, marks, attendance, and feedback.</p></div><span className="panel-heading-icon">✍️</span></div>
                  {notice && <div className="message info-message">{notice}</div>}
                  <form onSubmit={handleSaveStudent}>
                    <h3 className="form-section-title">01 <span>Personal & login details</span></h3>
                    <div className="input-grid">
                      <div className="field"><label>Student name</label><input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. Hari Bonthu" required /></div>
                      <div className="field"><label>Roll number</label><input value={form.roll} onChange={(e) => updateForm("roll", e.target.value)} placeholder="e.g. 2500080039" required /></div>
                      <div className="field"><label>Student username</label><input value={form.studentUsername} onChange={(e) => updateForm("studentUsername", e.target.value)} placeholder="Create student username" required /></div>
                      <div className="field"><label>Student password</label><input type="text" value={form.studentPassword} onChange={(e) => updateForm("studentPassword", e.target.value)} placeholder="Create student password" required /></div>
                      <div className="field"><label>Parent username</label><input value={form.parentUsername} onChange={(e) => updateForm("parentUsername", e.target.value)} placeholder="Create parent username" required /></div>
                      <div className="field"><label>Parent password</label><input type="text" value={form.parentPassword} onChange={(e) => updateForm("parentPassword", e.target.value)} placeholder="Create parent password" required /></div>
                    </div>

                    <h3 className="form-section-title">02 <span>Subject marks <small>Enter marks out of 100</small></span></h3>
                    <div className="marks-grid">
                      {SUBJECTS.map((subject, index) => <div className={`mark-field mark-${index}`} key={subject}><label>{subject}</label><input type="number" min="0" max="100" value={form.marks[subject]} onChange={(e) => updateMark(subject, e.target.value)} placeholder="0 – 100" required /></div>)}
                    </div>
                    <h3 className="form-section-title">03 <span>Attendance & teacher feedback</span></h3>
                    <div className="input-grid">
                      <div className="field"><label>Attendance percentage</label><div className="input-suffix"><input type="number" min="0" max="100" value={form.attendance} onChange={(e) => updateForm("attendance", e.target.value)} placeholder="e.g. 92" required /><span>%</span></div></div>
                      <div className="field field-wide"><label>Teacher remarks</label><textarea rows="3" value={form.remarks} onChange={(e) => updateForm("remarks", e.target.value)} placeholder="Write a short note about the student's progress..." /></div>
                    </div>
                    <div className="form-actions"><button className="primary-button" type="submit">{editingId ? "Save changes" : "Save student report"} <span>→</span></button>{editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel edit</button>}</div>
                  </form>
                </div>
              ) : (
                <div className="panel-card">
                  <div className="panel-heading"><div><span className="section-kicker">RECORD DIRECTORY</span><h2>Student records</h2><p>Search, edit, or remove student reports.</p></div><span className="panel-heading-icon">📚</span></div>
                  {notice && <div className="message info-message">{notice}</div>}
                  <div className="table-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, roll number, username..." /><span>{filteredStudents.length} record(s)</span></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Student</th><th>Roll number</th><th>Percentage</th><th>Attendance</th><th>Grade</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const percentage = getPercentage(student.marks);
                          return <tr key={student.id}>
                            <td><strong>{student.name}</strong><small>@{student.studentUsername}</small></td>
                            <td>{student.roll}</td><td><strong>{percentage}%</strong></td><td>{student.attendance}%</td>
                            <td><span className="grade-tag">{getGrade(percentage)}</span></td>
                            <td><div className="table-actions"><button onClick={() => handleEdit(student)} aria-label={`Edit ${student.name}`}>✎</button><button className="delete-action" onClick={() => handleDelete(student.id)} aria-label={`Delete ${student.name}`}>⌫</button></div></td>
                          </tr>;
                        })}
                        {filteredStudents.length === 0 && <tr><td colSpan="6" className="empty-state">No student records found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="list-footer"><span>Records are saved in this browser's local storage.</span><button onClick={resetDemoData}>↻ Restore demo data</button></div>
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {(page === "student" || page === "parent") && currentStudent && (
        <main className="dashboard-page">
          <div className="dashboard-welcome">
            <div><span className="section-kicker">{page === "student" ? "YOUR LEARNING SPACE" : "FAMILY OVERVIEW"}</span><h1>{page === "student" ? "Student" : "Parent"} <span>Dashboard</span></h1><p>{page === "student" ? "Your academic journey, clearly presented." : `Academic report for ${currentStudent.name}.`}</p></div>
            <button className="logout-button" onClick={logout}>↪ Log out</button>
          </div>
          <div className="student-profile-card">
            <div className="profile-avatar">{currentStudent.name.charAt(0).toUpperCase()}</div>
            <div className="profile-main"><span className="section-kicker">STUDENT PROFILE</span><h2>{currentStudent.name}</h2><p>Roll No: {currentStudent.roll}</p></div>
            <div className="profile-grade"><small>OVERALL GRADE</small><strong>{studentStats.grade}</strong><span>{studentStats.percentage}% score</span></div>
          </div>
          <div className="dashboard-stats student-metrics">
            <div className="metric-card metric-purple"><span>🏅</span><small>Total marks</small><strong>{studentStats.total}<i> / 600</i></strong><em>Across 6 subjects</em></div>
            <div className="metric-card metric-blue"><span>📊</span><small>Percentage</small><strong>{studentStats.percentage}%</strong><em>Overall performance</em></div>
            <div className="metric-card metric-orange"><span>📅</span><small>Attendance</small><strong>{currentStudent.attendance}%</strong><em>{currentStudent.attendance >= 75 ? "Attendance on track" : "Needs attention"}</em></div>
          </div>
          <section className="panel-card report-panel">
            <div className="panel-heading"><div><span className="section-kicker">ACADEMIC BREAKDOWN</span><h2>Subject-wise performance</h2><p>Your marks and progress in every subject.</p></div><span className="panel-heading-icon">📈</span></div>
            <div className="subject-results">
              {SUBJECTS.map((subject, index) => <div className="result-row" key={subject}><div className={`result-symbol result-${index}`}>{["💻", "🤖", "🖥️", "🔌", "☕", "📐"][index]}</div><div className="result-name"><strong>{subject}</strong><small>Subject {String(index + 1).padStart(2, "0")}</small></div><div className="result-progress"><div><span style={{ width: `${currentStudent.marks[subject]}%` }} /></div></div><strong className="result-score">{currentStudent.marks[subject]}<small>/100</small></strong></div>)}
            </div>
          </section>
          <section className="feedback-card"><div className="feedback-icon">💬</div><div><span className="section-kicker">TEACHER FEEDBACK</span><h3>A note about your progress</h3><p>{currentStudent.remarks || "No teacher remarks have been added yet."}</p></div></section>
          {currentStudent.attendance < 75 && <div className="message warning-message">Your attendance is below 75%. Please discuss an improvement plan with your class advisor.</div>}
        </main>
      )}

      <footer className="site-footer">
        <div className="footer-brand"><span>🎓</span><strong>Campus<span>Pulse</span></strong></div>
        <p>Student Performance & Attendance Management System</p>
        <small>© 2026 CampusPulse · Learn. Track. Grow.</small>
      </footer>
    </div>
  );
}

export default App;
