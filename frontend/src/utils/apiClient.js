const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
    };

    let csrfToken = document.cookie.split('; ').find(cookie => cookie.startsWith('csrfToken='))?.split('=').slice(1).join('=');
    if (!csrfToken) {
      try {
        csrfToken = localStorage.getItem('quizzify_csrf_token');
      } catch {}
    }
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
      headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
    }

    // Do not set Content-Type if uploading files (FormData handles its own boundaries)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
      credentials: 'include',
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Save CSRF token if returned in header
    const returnedCsrf = response.headers.get('x-csrf-token') || response.headers.get('X-CSRF-Token');
    if (returnedCsrf) {
      try {
        localStorage.setItem('quizzify_csrf_token', returnedCsrf);
      } catch {}
    }

    // Handle token expiry / unauthorized globally
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
      try {
        localStorage.removeItem('quizzify_has_session');
        localStorage.removeItem('quizzify_csrf_token');
      } catch {}
      window.dispatchEvent(new Event('auth-logout'));
    }

    const data = await response.json().catch(() => ({}));

    // Save CSRF token if present in response data
    if (data && data.csrfToken) {
      try {
        localStorage.setItem('quizzify_csrf_token', data.csrfToken);
      } catch {}
    }

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.response = { data, ...data, status: response.status };
      throw error;
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export default new ApiClient();
export { BASE_URL };
