// Small wrapper around fetch that talks to the backend and normalises errors.
(function () {
  const TOKEN_KEY = "placeready_token";
  const USER_KEY = "placeready_user";

  class ApiError extends Error {
    constructor(status, message, errors = {}, body = {}) {
      super(message);
      this.status = status;
      this.errors = errors; // { fieldName: "problem" }
      this.body = body;
    }
  }

  async function request(path, { method = "GET", body, auth = false, params } = {}) {
    const url = new URL(window.APP_CONFIG.API_BASE_URL + path);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && Session.token()) headers["Authorization"] = "Bearer " + Session.token();

    let res;
    try {
      res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.message || (typeof data.detail === "string" ? data.detail : "Something went wrong. Please try again.");
      throw new ApiError(res.status, message, data.errors || {}, data);
    }
    return data;
  }

  const Session = {
    save({ access_token, user }) {
      try {
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch { /* storage unavailable: session lasts for this page only */ }
      Session._memToken = access_token;
    },
    token() {
      try { return localStorage.getItem(TOKEN_KEY) || Session._memToken; } catch { return Session._memToken; }
    },
    clear() {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch {}
      Session._memToken = null;
    },
    _memToken: null,
  };

  window.Api = {
    ApiError,
    Session,
    login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),
    register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
    me: () => request("/api/auth/me", { auth: true }),
    usernameAvailable: (username) => request("/api/auth/username-available", { params: { username } }),
    searchColleges: (q) => request("/api/colleges/search", { params: { q, limit: 10 } }),
    listStates: () => request("/api/colleges/states"),
    addCollege: (payload) => request("/api/colleges", { method: "POST", body: payload }),
  };
})();
