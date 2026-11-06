const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if uploading files (FormData handles its own boundaries)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle token expiry / unauthorized globally
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.response = data;
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
