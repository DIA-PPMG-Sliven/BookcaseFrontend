// Full API client for the Bookcase API
// Edit `API_BASE` to point to your server
const api = (function(){
  // Set the default API base to the URL you provided
  // Change at runtime with `api.setBaseUrl(...)` if needed
  let API_BASE = 'https://azapptf2oro3bv6ahg.azurewebsites.net';
  let token = localStorage.getItem('bc_token') || null;
  let MOCK_MODE = false;

  function setMockMode(v){ MOCK_MODE = !!v; }

  // lightweight localStorage-backed mock for register/login so UI is interactable
  function _mockGetUsers(){ return JSON.parse(localStorage.getItem('bc_mock_users') || '[]'); }
  function _mockSaveUsers(u){ localStorage.setItem('bc_mock_users', JSON.stringify(u)); }
  const _mock = {
    async register({username, password, role}){
      const users = _mockGetUsers();
      if (!username || !password) throw new Error('Username and password required');
      if (users.find(u => u.username === username)) throw new Error('User already exists');
      const newUser = { id: Date.now(), username, password, role: role || 'user', token: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}` };
      users.push(newUser);
      _mockSaveUsers(users);
      return { token: newUser.token, username: newUser.username };
    },
    async login({username, password}){
      const users = _mockGetUsers();
      const u = users.find(x => x.username === username && x.password === password);
      if (!u) throw new Error('Invalid credentials (mock)');
      return { token: u.token, username: u.username };
    }
  };

  function setBaseUrl(url){ API_BASE = url.replace(/\/$/, ''); }
  function setAuthToken(t){ token = t; if (t) localStorage.setItem('bc_token', t); else localStorage.removeItem('bc_token'); }
  function getAuthToken(){ return token; }

  async function authFetch(path, opts = {}){
    const headers = opts.headers = opts.headers || {};
    // only set content-type when body exists and no content-type provided
    if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let res;
    try{
      res = await fetch(API_BASE + path, opts);
    }catch(e){
      throw new Error('Network error (possible CORS, DNS, HTTPS, or API downtime). Verify API URL and server health.');
    }
    if (!res.ok){
      let errText = await res.text();
      try{ const json = JSON.parse(errText); errText = json.message || JSON.stringify(json); }catch(e){}
      throw new Error(errText || res.statusText || 'Request failed');
    }
    const txt = await res.text();
    try{ return txt ? JSON.parse(txt) : null; }catch(e){ return txt; }
  }

  // Auth
  async function register({username, password, role}){
    if (MOCK_MODE) return await _mock.register({username, password, role});
    return await authFetch('/api/Auth/register', {method: 'POST', body: JSON.stringify({username, password, role})});
  }
  async function login({username, password}){
    if (MOCK_MODE){
      const r = await _mock.login({username, password});
      if (r && r.token) setAuthToken(r.token);
      return r;
    }

    const r = await authFetch('/api/Auth/login', {method: 'POST', body: JSON.stringify({username, password})});
    if (r && typeof r === 'object' && r.token) setAuthToken(r.token);
    else if (typeof r === 'string' && r.length > 10) setAuthToken(r);
    return r;
  }

  // Clients
  async function getClients(){ return await authFetch('/api/Clients', {method: 'GET'}); }
  async function getClient(id){ return await authFetch(`/api/Clients/${id}`, {method: 'GET'}); }
  async function deleteClient(id){ return await authFetch(`/api/Clients/${id}`, {method: 'DELETE'}); }

  // Majors
  async function getMajors(){ return await authFetch('/api/Majors', {method: 'GET'}); }
  async function getMajor(id){ return await authFetch(`/api/Majors/${id}`, {method: 'GET'}); }
  async function createMajor(payload){ return await authFetch('/api/Majors', {method: 'POST', body: JSON.stringify(payload)}); }
  async function updateMajor(id, payload){ return await authFetch(`/api/Majors/${id}`, {method: 'PUT', body: JSON.stringify(payload)}); }
  async function deleteMajor(id){ return await authFetch(`/api/Majors/${id}`, {method: 'DELETE'}); }

  // Exams
  async function getExams(){ return await authFetch('/api/Exams', {method: 'GET'}); }
  async function getExam(id){ return await authFetch(`/api/Exams/${id}`, {method: 'GET'}); }
  async function createExam(payload){ return await authFetch('/api/Exams', {method: 'POST', body: JSON.stringify(payload)}); }
  async function updateExam(id, payload){
    const client = payload?.client || null;
    const examPutPayload = {
      Id: Number(payload?.id || id),
      Date: payload?.date || null,
      Address: payload?.address || null,
      TestName: payload?.testName || null,
      ClientId: Number(payload?.clientId || client?.id || 0),
      Client: client ? {
        Id: Number(client.id || payload?.clientId || 0),
        Username: client.username ?? null,
        PasswordHash: client.passwordHash ?? null,
        Role: client.role ?? null
      } : null
    };

    return await authFetch(`/api/Exams/${id}`, {method: 'PUT', body: JSON.stringify(examPutPayload)});
  }
  async function deleteExam(id){ return await authFetch(`/api/Exams/${id}`, {method: 'DELETE'}); }

  // Applications
  async function getApplications(){ return await authFetch('/api/Applications', {method: 'GET'}); }
  async function createApplication(payload){ return await authFetch('/api/Applications', {method: 'POST', body: JSON.stringify(payload)}); }
  async function getApplication(id){ return await authFetch(`/api/Applications/${id}`, {method: 'GET'}); }
  async function updateApplication(id, payload){ return await authFetch(`/api/Applications/${id}`, {method: 'PUT', body: JSON.stringify(payload)}); }
  async function deleteApplication(id){ return await authFetch(`/api/Applications/${id}`, {method: 'DELETE'}); }

  // Utilities
  async function ping(){ try{ return await authFetch('/', {method: 'GET'}); }catch(e){ throw e; } }

  return {
    setBaseUrl, setAuthToken, getAuthToken,
    setMockMode,
    register, login,
    getClients, getClient, deleteClient,
    getMajors, getMajor, createMajor, updateMajor, deleteMajor,
    getExams, getExam, createExam, updateExam, deleteExam,
    getApplications, createApplication, getApplication, updateApplication, deleteApplication,
    ping
  };
})();

window.api = api;
