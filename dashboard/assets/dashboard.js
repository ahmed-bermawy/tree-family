// Shared dashboard helpers: auth + API

const API = {
  login: async (email, password) => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  get: async (path) => {
    return API.request('GET', path);
  },

  post: async (path, body) => {
    return API.request('POST', path, body);
  },

  patch: async (path, body) => {
    return API.request('PATCH', path, body);
  },

  del: async (path) => {
    return API.request('DELETE', path);
  },

  request: async (method, path, body) => {
    const token = localStorage.getItem('ft_token');
    const res = await fetch('/dashboard/api' + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('ft_token');
      window.location.href = '/dashboard/login.html';
      throw new Error('Unauthorized');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || 'Request failed');
    }
    return data;
  },
};

function requireAuth() {
  const token = localStorage.getItem('ft_token');
  if (!token) window.location.href = '/dashboard/login.html';
}

function logout() {
  localStorage.removeItem('ft_token');
  window.location.href = '/dashboard/login.html';
}

function setActiveNav(page) {
  document.querySelectorAll('.navbar nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function toggleMenu() {
  document.querySelector('.navbar nav').classList.toggle('open');
}
