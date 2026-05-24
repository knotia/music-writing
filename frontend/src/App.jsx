import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Progress from './components/Progress';
import TeacherDashboard from './components/TeacherDashboard';
import History from './components/History';
import { getToken, removeToken, getUserMe } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ageGroup, setAgeGroup] = useState(localStorage.getItem('ageGroup') || 'middle');

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthenticated) {
        try {
          const me = await getUserMe();
          setRole(me.role);
        } catch {
          removeToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [isAuthenticated]);

  const handleLogin = (userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
  };
  
  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setRole(null);
  };

  const handleAgeChange = (e) => {
    const val = e.target.value;
    setAgeGroup(val);
    localStorage.setItem('ageGroup', val);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <nav className="nav-bar">
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
            MusicThought AI <span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>({role === 'teacher' ? '선생님' : '학생'})</span>
          </div>
          <div className="nav-links">
            {role === 'student' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                  <label htmlFor="ageGroup" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>나의 연령대:</label>
                  <select 
                    id="ageGroup" 
                    value={ageGroup} 
                    onChange={handleAgeChange}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--surface-border)', outline: 'none' }}
                  >
                    <option value="elementary">초등학생 🧒</option>
                    <option value="middle">중/고등학생 🧑‍🎓</option>
                    <option value="adult">성인/대학생 👨‍💼</option>
                  </select>
                </div>
                <Link to="/dashboard">새 감상평 쓰기</Link>
                <Link to="/history">나의 글 보관함</Link>
                <Link to="/progress">나의 성장 리포트</Link>
              </>
            )}
            {role === 'teacher' && (
              <>
                <Link to="/teacher">학생 관리 대시보드</Link>
              </>
            )}
            <button onClick={handleLogout} className="btn" style={{ marginLeft: '24px', padding: '6px 12px', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)' }}>
              로그아웃
            </button>
          </div>
        </nav>
      )}
      <div className="container">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Auth onLogin={handleLogin} /> : <Navigate to={role === 'teacher' ? "/teacher" : "/dashboard"} />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated && role === 'student' ? <Dashboard ageGroup={ageGroup} /> : <Navigate to={role === 'teacher' ? "/teacher" : "/login"} />} 
          />
          <Route 
            path="/history" 
            element={isAuthenticated && role === 'student' ? <History ageGroup={ageGroup} /> : <Navigate to={role === 'teacher' ? "/teacher" : "/login"} />} 
          />
          <Route 
            path="/progress" 
            element={isAuthenticated && role === 'student' ? <Progress ageGroup={ageGroup} /> : <Navigate to={role === 'teacher' ? "/teacher" : "/login"} />} 
          />
          <Route 
            path="/teacher" 
            element={isAuthenticated && role === 'teacher' ? <TeacherDashboard /> : <Navigate to={role === 'student' ? "/dashboard" : "/login"} />} 
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? (role === 'teacher' ? "/teacher" : "/dashboard") : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
