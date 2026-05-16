/* Local (demo) authentication using localStorage.
   - register: creates a user record
   - login: validates and creates a session
   - session: stored in localStorage and can be read from other pages
*/
const AUTH_STORAGE_KEY = 'goalscorer_users_v1';
const SESSION_STORAGE_KEY = 'goalscorer_session_v1';

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getUsers() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  const parsed = raw ? safeParseJson(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

function setUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  const parsed = raw ? safeParseJson(raw) : null;
  return parsed && typeof parsed === 'object' ? parsed : null;
}

function setSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function validateRegisterPayload(payload) {
  const { fullname, email, username, password, confirmPassword, termsAccepted } = payload;

  if (!fullname || fullname.trim().length < 2) return 'Please enter your full name.';
  if (!email || normalizeEmail(email).length < 5) return 'Please enter a valid email.';
  if (!username || username.trim().length < 3) return 'Please enter a username (min 3 characters).';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  if (!termsAccepted) return 'You must accept the Terms to continue.';

  return null;
}

function validateLoginPayload(payload) {
  const { email, password } = payload;
  if (!email || normalizeEmail(email).length < 5) return 'Please enter a valid email.';
  if (!password) return 'Please enter your password.';
  return null;
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  const users = getUsers();
  return users.find((u) => normalizeEmail(u.email) === normalized) || null;
}

function createUser(payload) {
  const users = getUsers();
  const normalizedEmail = normalizeEmail(payload.email);

  const existing = users.some((u) => normalizeEmail(u.email) === normalizedEmail);
  if (existing) return { ok: false, error: 'An account with this email already exists.' };

  const user = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullname: payload.fullname.trim(),
    email: normalizedEmail,
    username: payload.username.trim(),
    // demo only: store password in plaintext (NOT secure). Replace with real backend hashing later.
    password: payload.password,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  setUsers(users);
  return { ok: true, user };
}

function loginUser(payload) {
  const error = validateLoginPayload(payload);
  if (error) return { ok: false, error };

  const user = findUserByEmail(payload.email);
  if (!user) return { ok: false, error: 'Invalid email or password.' };

  if (user.password !== payload.password) return { ok: false, error: 'Invalid email or password.' };

  const session = { userId: user.id, email: user.email, username: user.username, createdAt: new Date().toISOString() };
  setSession(session);
  return { ok: true, session };
}

function registerUser(payload) {
  const error = validateRegisterPayload(payload);
  if (error) return { ok: false, error };

  return createUser(payload);
}

function setFormMessage(el, message, type) {
  if (!el) return;
  const isError = type === 'error';
  el.textContent = message || '';
  el.classList.toggle('text-red-700', isError);
  el.classList.toggle('text-green-700', !isError && !!message);
  el.classList.toggle('hidden', !message);
}

function initAuthForms() {
  // LOGIN
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const emailEl = document.getElementById('login-email');
    const passwordEl = document.getElementById('login-password');
    const messageEl = document.getElementById('auth-message');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormMessage(messageEl, '', 'info');

      const result = loginUser({
        email: emailEl?.value || '',
        password: passwordEl?.value || '',
      });

      if (!result.ok) {
        setFormMessage(messageEl, result.error, 'error');
        return;
      }

      // Redirect to a page that exists in this project
      window.location.href = 'landingpage.html';
    });
  }

  // REGISTER
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const fullnameEl = document.getElementById('register-fullname');
    const emailEl = document.getElementById('register-email');
    const usernameEl = document.getElementById('register-username');
    const passwordEl = document.getElementById('register-password');
    const confirmEl = document.getElementById('register-confirm-password');
    const termsEl = document.getElementById('register-terms');
    const messageEl = document.getElementById('auth-message');

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      setFormMessage(messageEl, '', 'info');

      const result = registerUser({
        fullname: fullnameEl?.value || '',
        email: emailEl?.value || '',
        username: usernameEl?.value || '',
        password: passwordEl?.value || '',
        confirmPassword: confirmEl?.value || '',
        termsAccepted: !!termsEl?.checked,
      });

      if (!result.ok) {
        setFormMessage(messageEl, result.error, 'error');
        return;
      }

      // success -> clear form + redirect to login
      setFormMessage(messageEl, 'Account created. Redirecting to login...', 'success');
      window.setTimeout(() => {
        clearSession(); // ensure fresh login
        window.location.href = 'login.html';
      }, 600);
    });
  }
}

document.addEventListener('DOMContentLoaded', initAuthForms);

/* Expose helpers for potential later pages */
window.goalscorerAuth = {
  getSession,
  clearSession,
};
