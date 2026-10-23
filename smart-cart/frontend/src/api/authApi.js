
const API_URL = 'http://localhost:5000/api/auth';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const registerUser = (userData) =>
  request('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const loginUser = (credentials) =>
  request('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const getCurrentUser = () => request('/me');

export const logoutUser = () =>
  request('/logout', { method: 'POST' });
