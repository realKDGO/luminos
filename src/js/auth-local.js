/* ══════════════════════════════════════
   Luminos · auth-local.js
   LocalStorage-based Auth System
══════════════════════════════════════ */

const Auth = (() => {
  const USERS_KEY = 'luminos_users';
  const SESSION_KEY = 'luminos_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function getCurrentUser() {
    return getSession();
  }

  function signup(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { error: 'An account with this email already exists.' };
    }
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    const user = { id: Date.now().toString(), name, email, password, createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    const session = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: session };
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { error: 'Invalid email or password.' };
    }
    const session = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: session };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '../index.html';
  }

  return { isLoggedIn, getCurrentUser, signup, login, logout };
})();
