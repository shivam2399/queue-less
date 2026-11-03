const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    ...customConfig
  } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Attach CSRF token on mutating requests if present in cookies
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !defaultHeaders['X-CSRF-Token']) {
      defaultHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  const config = {
    method: method.toUpperCase(),
    headers: defaultHeaders,
    credentials: 'include',
    ...customConfig
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.code = data.code || 'API_ERROR';
      error.details = data.details || [];
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.status = 503;
      error.message = error.message || 'Unable to connect to server. Please check your connection.';
      error.code = 'NETWORK_ERROR';
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options })
};
