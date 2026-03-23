const BASE_API_URL = 'http://localhost:5000';

/**
 * HTTP client for communicating with the Backend API.
 * Handles JSON serialization, authentication cookies, and error responses.
 */
export default class ApiClient {
  constructor() {
    this.base_url =  BASE_API_URL + '/api';
  }

  /**
   * Execute an HTTP request to the API.
   * @param {Object} options - Request configuration
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} options.url - API endpoint path
   * @param {Object} [options.query] - URL query parameters
   * @param {Object} [options.body] - Request body (will be JSON serialized)
   * @param {Object} [options.headers] - Additional headers
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async request(options) {
    let query = new URLSearchParams(options.query || {}).toString();
    if (query !== '') {
      query = '?' + query;
    }

    let response;
    try {
      response = await fetch(this.base_url + options.url + query, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : null,
      });
    }
    catch (error) {
      response = {
        ok: false,
        status: 500,
        json: async () => { return {
          code: 500,
          message: 'The server is unresponsive',
          description: error.toString(),
        }; }
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      body: response.status !== 204 ? await response.json() : null
    };
  }

  /**
   * Execute a GET request.
   * @param {string} url - API endpoint path
   * @param {Object} [query] - URL query parameters
   * @param {Object} [options] - Additional request options
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async get(url, query, options) {
    return this.request({method: 'GET', url, query, ...options});
  }

  /**
   * Execute a POST request.
   * @param {string} url - API endpoint path
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Additional request options
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async post(url, body, options) {
    return this.request({method: 'POST', url, body, ...options});
  }

  /**
   * Execute a PUT request.
   * @param {string} url - API endpoint path
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Additional request options
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async put(url, body, options) {
    return this.request({method: 'PUT', url, body, ...options});
  }

  /**
   * Execute a DELETE request.
   * @param {string} url - API endpoint path
   * @param {Object} [options] - Additional request options
   * @returns {Promise<{ok: boolean, status: number, body: Object|null}>}
   */
  async delete(url, options) {
    return this.request({method: 'DELETE', url, ...options});
  }
}