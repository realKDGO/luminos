/* ══════════════════════════════════════
   Cognify · auth.js
   Login & Signup — backed by Supabase Auth.
   Loaded on: login.html, signup.html
══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  applyAuthSettings();

  // Show account-deleted confirmation if redirected from settings
  if (new URLSearchParams(window.location.search).get('deleted') === '1') {
    const msg = document.getElementById('account-deleted-msg');
    if (msg) msg.classList.remove('hidden');
    // Clean the URL without reloading
    history.replaceState({}, '', window.location.pathname);
  }

  // Already logged in → go straight to dashboard
  const { data: { session } } = await db.auth.getSession();
  if (session) { window.location.href = 'dashboard.html'; return; }

  // Enter key submits whichever form is on this page
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('login-error'))  handleLogin();
    if (document.getElementById('signup-error')) handleSignup();
  });
});

/* ── Apply persisted display settings ── */
function applyAuthSettings() {
  // Use the same theme system as app.js
  const theme = store.get('sf_theme', store.get('sf_dark_mode', false) ? 'dark' : 'system');
  const isDark = theme === 'dark'
    ? true
    : theme === 'light'
      ? false
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('dyslexic-font', store.get('sf_dyslexic', false));
  const sizes = { small: '14px', medium: '16px', large: '19px' };
  document.documentElement.style.fontSize =
    sizes[store.get('sf_text_size', 'medium')] || '16px';
}

/* ── Error helpers ── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

/* ── Show post-signup "check your email" card ── */
function showSignupSuccess(email) {
  document.getElementById('signup-form-card')?.classList.add('hidden');
  const successEl = document.getElementById('signup-success-card');
  if (successEl) {
    document.getElementById('signup-success-email').textContent = email;
    successEl.classList.remove('hidden');
  }
}

/* ── Disable / re-enable submit button during async calls ── */
function setAuthLoading(formPrefix, loading) {
  const btn = document.querySelector(`#${formPrefix}-form button[class*="btn-primary"]`);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.6' : '';
}

/* ────────────────────────
   LOGIN
──────────────────────── */
async function handleLogin() {
  clearError('login-error');
  const email = document.getElementById('login-email')?.value.trim();
  const pw    = document.getElementById('login-password')?.value;
  if (!email || !pw) { showError('login-error', 'Please fill in all fields.'); return; }

  setAuthLoading('login', true);
  const { error } = await db.auth.signInWithPassword({ email, password: pw });
  setAuthLoading('login', false);

  if (error) { showError('login-error', 'Invalid email or password.'); return; }
  window.location.href = 'dashboard.html';
}

/* ────────────────────────
   SIGNUP
──────────────────────── */
async function handleSignup() {
  clearError('signup-error');
  const name  = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const pw    = document.getElementById('signup-password')?.value;

  if (!name || !email || !pw) { showError('signup-error', 'Please fill in all fields.'); return; }
  if (!isValidEmail(email))   { showError('signup-error', 'Enter a valid email address.'); return; }
  if (pw.length < 6)          { showError('signup-error', 'Password must be at least 6 characters.'); return; }

  const agreed = document.getElementById('agree-checkbox')?.checked;
  if (!agreed) {
    showError('signup-error', 'You must agree to the Terms & Conditions and Privacy Policy to create an account.');
    return;
  }

  setAuthLoading('signup', true);

  // 1. Create the auth account
  let data, error;
  try {
    ({ data, error } = await db.auth.signUp({ email, password: pw }));
  } catch (networkErr) {
    setAuthLoading('signup', false);
    showError('signup-error', 'Network error. Please try again.');
    return;
  }

  if (error) {
    setAuthLoading('signup', false);
    const msg = error.message.toLowerCase().includes('already registered')
      ? 'An account with this email already exists.'
      : error.message;
    showError('signup-error', msg);
    return;
  }

  // 2. Insert the display name into public.users
  if (data?.user) {
    const { error: profileError } = await db
      .from('users')
      .insert({ id: data.user.id, name, email });
    if (profileError) console.warn('Could not save user profile:', profileError.message);
  }

  // 3. Fire welcome email — don't await so it never blocks the redirect.
  //    fetch uses keepalive:true so the request survives navigation.
  sendWelcomeEmail(name, email);

  setAuthLoading('signup', false);

  // Trigger onboarding for new users.
  // Remove sf_ob_done in case this browser previously completed a tour
  // under a different account — every new signup gets a fresh tour.
  localStorage.removeItem('sf_ob_done');
  localStorage.setItem('sf_ob_active', 'true');
  localStorage.setItem('sf_ob_step', '0');

  window.location.href = 'dashboard.html';
}

/* ── Fire welcome email via Edge Function ── */
async function sendWelcomeEmail(name, email) {
  const supabaseUrl = window.ENV?.SUPABASE_URL ?? '';
  const anonKey    = window.ENV?.SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl) return;

  try {
    fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
      method: 'POST',
      keepalive: true,          // survives page navigation
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ name, email }),
    }).catch(err => console.warn('Welcome email error:', err));
  } catch (err) {
    console.warn('Welcome email could not be sent:', err);
  }
}

/* ────────────────────────
   FORGOT PASSWORD — show/hide panels
──────────────────────── */
function showForgotPassword() {
  document.getElementById('login-card').classList.add('hidden');
  document.getElementById('forgot-card').classList.remove('hidden');
  document.getElementById('forgot-email').focus();
  clearError('forgot-error');
  document.getElementById('forgot-success')?.classList.add('hidden');
}

function showLogin() {
  document.getElementById('forgot-card').classList.add('hidden');
  document.getElementById('login-card').classList.remove('hidden');
  clearError('login-error');
}

/* ────────────────────────
   FORGOT PASSWORD — send reset email
──────────────────────── */
async function handleForgotPassword() {
  clearError('forgot-error');
  const successEl = document.getElementById('forgot-success');
  successEl?.classList.add('hidden');

  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email) { showError('forgot-error', 'Please enter your email address.'); return; }
  if (!isValidEmail(email)) { showError('forgot-error', 'Enter a valid email address.'); return; }

  const btn = document.querySelector('#forgot-card .btn-primary');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

  try {
    // Build the redirect URL — the reset link in the email takes the user here
    const origin   = window.location.origin.replace(/\/$/, '');
    const resetUrl = `${origin}/src/reset-password.html`;

    // Call our own edge function which:
    //   1. Generates the reset link via Supabase admin API
    //   2. Sends it via Brevo (same delivery channel as welcome email)
    const res = await fetch(`${window.ENV.SUPABASE_URL}/functions/v1/send-reset-email`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${window.ENV.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, redirect_url: resetUrl }),
    });

    if (btn) { btn.disabled = false; btn.style.opacity = ''; }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[forgotPassword] edge function error:', body);
      showError('forgot-error', body?.error || 'Could not send reset email. Please try again.');
      return;
    }
  } catch (err) {
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    console.error('[forgotPassword] network error:', err);
    showError('forgot-error', 'Network error. Please check your connection and try again.');
    return;
  }

  // Always show success — prevents email enumeration
  if (successEl) {
    successEl.textContent = `If an account exists for ${email}, a reset link has been sent. Check your inbox and spam folder.`;
    successEl.classList.remove('hidden');
  }
  document.getElementById('forgot-email').value = '';
}
