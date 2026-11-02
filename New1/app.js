// ==========================================================================
// TESTING APP GLASSMORPHIC ENTERPRISE TARGET APP
// ==========================================================================

// Robustly determine the API base URL for any environment
const API_BASE_URL = (function () {
  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:4000/api';
  }
  return '/api';
})();

let authToken = localStorage.getItem('testing_app_token') || localStorage.getItem('antigravity_token') || null;
let currentUser = JSON.parse(localStorage.getItem('testing_app_user') || localStorage.getItem('antigravity_user') || 'null');
let currentCaptcha = '';

// Helper to generate dynamic Captcha verification codes
function generateCaptcha() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  currentCaptcha = result;
  const captchaEl = document.getElementById('captcha-code');
  if (captchaEl) {
    captchaEl.textContent = result;
  }
  return result;
}

// Helper to toggle Light & Dark Theme
function initThemeToggle() {
  const isLight = localStorage.getItem('testing_app_theme') === 'light';
  if (isLight) {
    document.body.classList.add('light-theme');
    updateThemeButtonText(true);
  }

  const toggleBtns = [
    document.getElementById('theme-toggle-btn'),
    document.getElementById('portal-theme-toggle-btn')
  ];

  toggleBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        const currentlyLight = document.body.classList.toggle('light-theme');
        localStorage.setItem('testing_app_theme', currentlyLight ? 'light' : 'dark');
        updateThemeButtonText(currentlyLight);
        showToast(currentlyLight ? 'Switched to Light Theme' : 'Switched to Dark Theme', 'info');
      });
    }
  });
}

function updateThemeButtonText(isLight) {
  const icon1 = document.getElementById('theme-icon');
  const text1 = document.getElementById('theme-text');
  const icon2 = document.getElementById('portal-theme-icon');
  const text2 = document.getElementById('portal-theme-text');

  if (icon1 && text1) {
    icon1.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    text1.textContent = isLight ? 'Dark Theme' : 'Light Theme';
  }
  if (icon2 && text2) {
    icon2.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    text2.textContent = isLight ? 'Dark Theme' : 'Light Theme';
  }
}

// DOM Elements
const cardWrapper = document.getElementById('card-wrapper');
const authCard = document.getElementById('auth-card');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const tabDashboard = document.getElementById('tab-dashboard');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const quickDemoBtn = document.getElementById('quick-demo-btn');
const toggleLoginPwd = document.getElementById('toggle-login-pwd');

const dashAvatar = document.getElementById('dash-avatar');
const dashName = document.getElementById('dash-name');
const dashEmail = document.getElementById('dash-email');
const dashRole = document.getElementById('dash-role');
const logoutBtn = document.getElementById('logout-btn');

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
  init3DTilt();
  initTabs();
  initThemeToggle();
  generateCaptcha();
  initAuthLogic();
  checkSession();

  const captchaRefresh = document.getElementById('captcha-refresh-btn');
  if (captchaRefresh) {
    captchaRefresh.addEventListener('click', () => {
      generateCaptcha();
      showToast('New Captcha verification code generated', 'info');
    });
  }
});

// ==================== BACKGROUND ANIMATION ====================
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 242, 254, ${p.alpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2fe';
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  render();
}

// ==================== 3D TILT EFFECT ====================
function init3DTilt() {
  if (!cardWrapper || !authCard) return;

  cardWrapper.addEventListener('mousemove', (e) => {
    const rect = cardWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = (-y / rect.height) * 10;
    const rotateY = (x / rect.width) * 10;

    authCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  cardWrapper.addEventListener('mouseleave', () => {
    authCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
}

// ==================== TABS ====================
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });
}

function switchTab(targetId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const activeTab = document.querySelector(`[data-tab="${targetId}"]`);
  const activePane = document.getElementById(targetId);

  if (activeTab) activeTab.classList.add('active');
  if (activePane) activePane.classList.add('active');

  if (cardWrapper) {
    if (targetId === 'dashboard-tab') {
      cardWrapper.classList.add('wide-mode');
    } else {
      cardWrapper.classList.remove('wide-mode');
    }
  }
}

// ==================== BACKEND AUTH LOGIC ====================
function initAuthLogic() {
  // Login Submit -> Multi-stage auth with Suraksha-AI Threat Verification
  let credentialsVerified = false;

  // Reset captcha visibility if email/password changes
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const captchaGroup = document.getElementById('captcha-group');
  const loginBtn = document.getElementById('login-btn');
  const loginBtnText = loginBtn ? loginBtn.querySelector('.btn-text') : null;

  function resetToInitialStep() {
    credentialsVerified = false;
    if (captchaGroup) captchaGroup.style.display = 'none';
    if (loginBtnText) loginBtnText.innerHTML = 'Verify Credentials <i class="fa-solid fa-arrow-right"></i>';
  }

  if (emailInput) emailInput.addEventListener('input', resetToInitialStep);
  if (passwordInput) passwordInput.addEventListener('input', resetToInitialStep);

  // Quick demo fill
  quickDemoBtn.addEventListener('click', () => {
    document.getElementById('login-email').value = 'admin@antigravity.io';
    document.getElementById('login-password').value = 'password123';
    resetToInitialStep();
    showToast('Demo credentials pre-filled! Click "Verify Credentials".', 'info');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const captchaInput = document.getElementById('captcha-input');

    // Stage 2: If credentials are already verified, validate the Captcha
    if (credentialsVerified) {
      const enteredCaptcha = captchaInput ? captchaInput.value.trim().toUpperCase() : '';
      if (!enteredCaptcha || enteredCaptcha !== currentCaptcha) {
        showToast('Security Verification Failed: Incorrect Captcha code.', 'error');
        generateCaptcha();
        if (captchaInput) {
          captchaInput.value = '';
          captchaInput.focus();
        }
        return;
      }

      setLoading(loginBtn, true);
      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        setLoading(loginBtn, false);

        if (res.ok && data.token) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('testing_app_token', authToken);
          localStorage.setItem('testing_app_user', JSON.stringify(currentUser));

          showToast('Security clearance verified! Welcome Agent.', 'success');
          updateDashboardUI();
        } else {
          showToast(data.message || 'Authentication error', 'error');
          resetToInitialStep();
        }
      } catch (err) {
        setLoading(loginBtn, false);
        showToast('Connection error: Checking backend connectivity...', 'error');
      }
      return;
    }

    // Stage 1: Send credentials to server (Suraksha-AI WAF inspects for SQL Injection FIRST)
    setLoading(loginBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setLoading(loginBtn, false);

      // If Suraksha-AI intercepts SQL Injection attack
      if (res.status === 403 || data.blocked || data.suraksha_verdict === 'BLOCKED') {
        // Attack detected: DO NOT reveal or show captcha
        resetToInitialStep();
        showToast(data.message || '🚨 Request Blocked: SQL Injection signature intercepted by Suraksha-AI.', 'error');
        return;
      }

      // If credentials failed (wrong password/user not found)
      if (!res.ok) {
        resetToInitialStep();
        showToast(data.message || 'Authentication failed: Invalid credentials.', 'error');
        return;
      }

      // If credentials are valid, present the Captcha security challenge
      credentialsVerified = true;
      generateCaptcha();
      if (captchaGroup) {
        captchaGroup.style.display = 'block';
        if (captchaInput) {
          captchaInput.value = '';
          captchaInput.focus();
        }
      }
      if (loginBtnText) {
        loginBtnText.innerHTML = 'Confirm Security Code <i class="fa-solid fa-shield-check"></i>';
      }
      showToast('Credentials accepted! Please complete the security captcha verification.', 'success');

    } catch (err) {
      setLoading(loginBtn, false);
      showToast('Connection error: Checking backend connectivity...', 'error');
    }
  });

  // Register Submit -> POST /api/register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const regBtn = document.getElementById('register-btn');
    setLoading(regBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      setLoading(regBtn, false);

      if (res.ok && data.token) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('antigravity_token', authToken);
        localStorage.setItem('antigravity_user', JSON.stringify(currentUser));

        showToast('Account created and saved to database!', 'success');
        updateDashboardUI();
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      setLoading(regBtn, false);
      showToast('Backend connection error', 'error');
    }
  });

  // Logout -> POST /api/logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
      } catch (err) {}

      authToken = null;
      currentUser = null;
      localStorage.removeItem('antigravity_token');
      localStorage.removeItem('antigravity_user');

      const portalEl = document.getElementById('full-portal-dashboard');
      const authContEl = document.getElementById('auth-container');
      const topNavEl = document.querySelector('.top-nav');

      if (portalEl) portalEl.classList.add('hidden');
      if (authContEl) authContEl.classList.remove('hidden');
      if (topNavEl) topNavEl.classList.remove('hidden');

      showToast('Signed out successfully', 'info');
    });
  }

  // Live Table Search
  const tableSearchInput = document.getElementById('table-search');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#target-records-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

function checkSession() {
  if (authToken && currentUser) {
    updateDashboardUI();
  }
}

function updateDashboardUI() {
  if (!currentUser) return;
  const portalEl = document.getElementById('full-portal-dashboard');
  const authContEl = document.getElementById('auth-container');
  const topNavEl = document.querySelector('.top-nav');

  if (portalEl) portalEl.classList.remove('hidden');
  if (authContEl) authContEl.classList.add('hidden');
  if (topNavEl) topNavEl.classList.add('hidden');

  if (dashName) dashName.textContent = currentUser.name;
  if (dashEmail) dashEmail.textContent = currentUser.email;
  if (dashRole) dashRole.textContent = currentUser.role || 'System Admin';
  if (dashAvatar) dashAvatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
}

// ==================== TOAST & UTILS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type]}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setLoading(button, isLoading) {
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.btn-spinner');

  if (isLoading) {
    if (text) text.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    button.disabled = true;
  } else {
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    button.disabled = false;
  }
}

// ==================== REAL-TIME ATTACK VISUAL ANIMATION ====================
function animateAttackInLoginUI(payloadText) {
  if (!payloadText || payloadText === 'admin@antigravity.io' || payloadText === 'elena@antigravity.io') return;

  // 1. Red Screen Vignette Flash
  let vignette = document.getElementById('screen-vignette');
  if (vignette) vignette.remove();
  vignette = document.createElement('div');
  vignette.id = 'screen-vignette';
  vignette.className = 'screen-vignette-flash';
  document.body.appendChild(vignette);
  setTimeout(() => { if (vignette) vignette.remove(); }, 1200);

  // 2. Fixed High-Visibility Top Alert Banner
  let banner = document.getElementById('attack-banner');
  if (banner) banner.remove();
  banner = document.createElement('div');
  banner.id = 'attack-banner';
  banner.className = 'attack-live-banner';
  banner.innerHTML = `<span class="banner-pulse-dot"></span> <i class="fa-solid fa-triangle-exclamation"></i> <span>SURAKSHA-AI DETECTED SQL ATTACK:</span> <code>${payloadText}</code>`;
  document.body.appendChild(banner);

  setTimeout(() => {
    if (banner) banner.remove();
  }, 2200);

  // 3. Login Card Character-by-Character Auto-Typing Effect
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const authCardEl = document.getElementById('auth-card');

  if (emailInput && pwdInput) {
    if (emailInput.dataset.typingTimer) {
      clearTimeout(parseInt(emailInput.dataset.typingTimer));
    }

    if (authCardEl) {
      authCardEl.classList.remove('card-attack-shake');
      void authCardEl.offsetWidth; // trigger reflow
      authCardEl.classList.add('card-attack-shake');
    }

    emailInput.classList.add('input-attack-pulse');
    pwdInput.classList.add('input-attack-pulse');

    emailInput.value = '';
    let i = 0;
    
    function typeNextChar() {
      if (i < payloadText.length) {
        emailInput.value += payloadText.charAt(i);
        i++;
        emailInput.dataset.typingTimer = setTimeout(typeNextChar, 35);
      } else {
        setTimeout(() => {
          emailInput.classList.remove('input-attack-pulse');
          pwdInput.classList.remove('input-attack-pulse');
          if (authCardEl) authCardEl.classList.remove('card-attack-shake');
        }, 1800);
      }
    }

    typeNextChar();
  }

  // 4. Target Application Audit Log Terminal Stream
  const auditTerm = document.getElementById('target-audit-terminal');
  if (auditTerm) {
    const now = new Date().toTimeString().split(' ')[0];
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    logLine.innerHTML = `<span class="time">${now}</span> <span class="tag warning">[INTERCEPTED]</span> SQLi Vector: <code>${payloadText}</code>`;
    auditTerm.appendChild(logLine);
    auditTerm.scrollTop = auditTerm.scrollHeight;
  }
}

// Global hook: Listen for incoming attack telemetry
window.triggerTargetAttackAnimation = function(payload) {
  animateAttackInLoginUI(payload);
};

// Initialize Live SSE Stream Listener from Target Server
function initLiveAttackStreamListener() {
  try {
    const streamUrl = 'http://' + (window.location.hostname || 'localhost') + ':3000/api/live-attacks-stream';
    console.log('📡 Connecting to live attack SSE stream at:', streamUrl);
    const evtSource = new EventSource(streamUrl);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.payload) {
          console.log('🚨 Live attack broadcast received:', data.payload);
          animateAttackInLoginUI(data.payload);
        }
      } catch (err) {}
    };

    evtSource.onerror = () => {
      console.log('⚠️ SSE stream disconnected, reconnecting...');
    };
  } catch (e) {
    console.error('SSE connection error:', e);
  }
}

initLiveAttackStreamListener();
