const API_URL = import.meta.env.VITE_API_URL || 'https://music-thought-api.onrender.com/api/v1';

export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }
  return response.json();
};

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }
  return response.json();
};

export const register = async (username, password, role = 'student') => {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, role })
  });
};

export const getUserMe = async () => {
  return request('/auth/me');
};

export const analyzeThought = async (raw_sentence, session_id) => {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'auto',
      session_id,
      raw_sentence
    })
  });
};

export const getProgress = async () => {
  return request('/analyze/progress');
};

// Teacher APIs
export const getStudents = async () => {
  return request('/teacher/students');
};

export const getStudentProgress = async (studentId) => {
  return request(`/teacher/students/${studentId}/progress`);
};
