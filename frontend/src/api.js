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
    const detail = errorData.detail;
    const errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail || 'API request failed');
    throw new Error(errorMessage);
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

export const analyzeThoughtStream = async (rawSentence, sessionId, history = [], assignmentQuestion = '', writingStyle = 'academic', ageGroup = 'middle') => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const bodyData = {
    user_id: 'auto',
    raw_sentence: rawSentence,
    session_id: sessionId,
    writing_style: writingStyle,
    age_group: ageGroup,
    history: history
  };

  if (assignmentQuestion.trim()) {
    bodyData.assignment_question = assignmentQuestion.trim();
  }

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail;
    const errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail || 'API request failed');
    throw new Error(errorMessage);
  }

  return response;
};

export const getProgress = async () => {
  return request('/analyze/progress');
};

export const getHistory = async () => {
  return request('/analyze/history');
};

// Teacher APIs
export const getStudents = async () => {
  return request('/teacher/students');
};

export const getStudentProgress = async (studentId) => {
  return request(`/teacher/students/${studentId}/progress`);
};

export const getClassOverview = async () => {
  return request('/teacher/overview');
};

export const getStudentHistory = async (studentId) => {
  return request(`/teacher/students/${studentId}/history`);
};
