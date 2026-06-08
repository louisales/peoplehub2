// ─── API CLIENT ───────────────────────────────────────────────────────────────
const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  };
  const config = { ...defaults, ...options };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  try {
    const res = await fetch(API_BASE + path, config);
    if (res.status === 401) {
      showLoginPage();
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  } catch (err) {
    if (!err.message.includes('401')) showToast(err.message, 'error');
    return null;
  }
}

const api = {
  get:    (path, params = {}) => {
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
    return apiFetch(path + qs);
  },
  post:   (path, body) => apiFetch(path, { method: 'POST', body }),
  put:    (path, body) => apiFetch(path, { method: 'PUT', body }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};
