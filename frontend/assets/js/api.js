// API Client for Doto Backend (TickTick Clone)

const API_BASE = '/api/v1';

export class ApiClient {
  static getToken() {
    return localStorage.getItem('doto_token');
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem('doto_token', token);
    } else {
      localStorage.removeItem('doto_token');
    }
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        // Clear token on 401 and trigger auth event
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Требуется авторизация');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errData.detail || 'Произошла ошибка при запросе к серверу');
      }

      if (res.status === 204) {
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth
  static auth = {
    register: (data) => ApiClient.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => ApiClient.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    demo: () => ApiClient.request('/auth/demo', { method: 'POST' }),
    me: () => ApiClient.request('/auth/me'),
  };

  // User Profile & Settings
  static users = {
    updateProfile: (data) => ApiClient.request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  };

  // Tasks
  static tasks = {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return ApiClient.request(`/tasks${q ? `?${q}` : ''}`);
    },
    getOne: (id) => ApiClient.request(`/tasks/${id}`),
    create: (data, smartParse = true) => ApiClient.request(`/tasks?smart_parse=${smartParse}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => ApiClient.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    toggle: (id) => ApiClient.request(`/tasks/${id}/toggle`, { method: 'POST' }),
    delete: (id, permanent = false) => ApiClient.request(`/tasks/${id}?permanent=${permanent}`, { method: 'DELETE' }),
    batch: (data) => ApiClient.request('/tasks/batch', { method: 'POST', body: JSON.stringify(data) }),

    // Subtasks
    createSubtask: (taskId, data) => ApiClient.request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateSubtask: (taskId, subtaskId, data) => ApiClient.request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubtask: (taskId, subtaskId) => ApiClient.request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
  };

  // Lists
  static lists = {
    getAll: () => ApiClient.request('/lists'),
    create: (data) => ApiClient.request('/lists', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => ApiClient.request(`/lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => ApiClient.request(`/lists/${id}`, { method: 'DELETE' }),
  };

  // Tags
  static tags = {
    getAll: () => ApiClient.request('/tags'),
    create: (data) => ApiClient.request('/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => ApiClient.request(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => ApiClient.request(`/tags/${id}`, { method: 'DELETE' }),
  };

  // Habits
  static habits = {
    getAll: (includeArchived = false) => ApiClient.request(`/habits?include_archived=${includeArchived}`),
    create: (data) => ApiClient.request('/habits', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => ApiClient.request(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => ApiClient.request(`/habits/${id}`, { method: 'DELETE' }),
    checkin: (id, checkDate, value = 1, note = '') => {
      const q = new URLSearchParams({ value, ...(checkDate ? { check_date: checkDate } : {}), ...(note ? { note } : {}) });
      return ApiClient.request(`/habits/${id}/checkin?${q}`, { method: 'POST' });
    },
    uncheck: (id, checkDate) => {
      const q = checkDate ? `?check_date=${checkDate}` : '';
      return ApiClient.request(`/habits/${id}/uncheck${q}`, { method: 'POST' });
    },
  };

  // Pomodoro & Focus
  static focus = {
    getSessions: (limit = 50) => ApiClient.request(`/focus/sessions?limit=${limit}`),
    createSession: (data) => ApiClient.request('/focus/sessions', { method: 'POST', body: JSON.stringify(data) }),
    getStats: () => ApiClient.request('/focus/stats'),
  };

  // Eisenhower Matrix
  static matrix = {
    getMatrix: (includeCompleted = false) => ApiClient.request(`/matrix?include_completed=${includeCompleted}`),
    setQuadrant: (taskId, quadrant) => ApiClient.request(`/matrix/${taskId}/quadrant?quadrant=${quadrant}`, { method: 'PUT' }),
  };

  // Calendar
  static calendar = {
    getEvents: (startDate, endDate, includeCompleted = true) => {
      const q = new URLSearchParams({
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        include_completed: includeCompleted,
      });
      return ApiClient.request(`/calendar/events?${q}`);
    },
  };

  // Stats & Productivity Karma
  static stats = {
    getSummary: () => ApiClient.request('/stats/summary'),
  };
}
