const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let inMemoryCsrfToken = null;

export function setCsrfToken(token) {
  if (token) {
    inMemoryCsrfToken = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem('queueless_csrf', token);
      } catch (e) {}
    }
  }
}

export function getCsrfToken() {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem('queueless_csrf');
      if (stored) {
        inMemoryCsrfToken = stored;
        return stored;
      }
    } catch (e) {}
  }
  return getCsrfTokenFromCookie();
}

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

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const isAuthPublic = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');

  // Attach CSRF token on mutating requests
  if (isMutating) {
    let csrfToken = getCsrfToken();
    
    // If missing and not an auth initiation endpoint, fetch a fresh CSRF token
    if (!csrfToken && !isAuthPublic) {
      try {
        const csrfRes = await fetch(`${API_BASE_URL}/auth/csrf`, {
          method: 'GET',
          credentials: 'include'
        });
        const csrfHeader = csrfRes.headers.get('x-csrf-token');
        const csrfJson = await csrfRes.json().catch(() => null);
        csrfToken = csrfHeader || csrfJson?.data?.csrfToken;
        if (csrfToken) {
          setCsrfToken(csrfToken);
        }
      } catch (e) {
        // Silently continue and let backend handle verification
      }
    }

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

    // Capture any CSRF token exposed in the response header
    const responseCsrfHeader = response.headers.get('x-csrf-token');
    if (responseCsrfHeader) {
      setCsrfToken(responseCsrfHeader);
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Capture any CSRF token returned in the JSON payload
    if (data?.data?.csrfToken) {
      setCsrfToken(data.data.csrfToken);
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
