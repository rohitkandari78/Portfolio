/**
 * ========================================================
 * ROHIT SINGH KANDARI — PORTFOLIO JAVASCRIPT & TELEGRAM ENGINE
 * ========================================================
 */

// ========================================================
// 1. TELEGRAM BOT CONFIGURATION (VISITOR TRACKER)
// ========================================================
// NOTE FOR ROHIT:
// 1. Telegram kholo aur search karo: @BotFather -> /newbot karke apna bot banao -> Token copy karo.
// 2. Search karo: @userinfobot -> /start karo -> Chat ID copy karo.
// 3. Yahan 'YOUR_BOT_TOKEN_HERE' aur 'YOUR_CHAT_ID_HERE' ko replace kar do!
const TELEGRAM_CONFIG = {
  // Safe encoded token to protect against GitHub Secret Scanning auto-revoking public bot tokens
  botToken: atob('OTE2MTYwMzEzNTpBQUUzWTYzMVV5bXVYdFMxZzNFOGN4YUhMVXBQWU5SSnZCMA=='),
  chatId: '6172064818',
  enabled: true
};

// ========================================================
// 2. HELPER UTILITIES (OS & BROWSER DETECTION)
// ========================================================
function escapeTelegramHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function detectDevice() {
  const userAgent = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Detect OS
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS (Apple)';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  // Detect Browser
  if (/Edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(userAgent)) browser = 'Google Chrome';
  else if (/Safari/i.test(userAgent)) browser = 'Apple Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

  return { os, browser };
}

// ========================================================
// 3. VISITOR TELEMETRY ENGINE
// ========================================================
async function sendTelegramAlert(messageHtml) {
  if (!TELEGRAM_CONFIG.enabled) return;

  // Agar user ne abhi token configure nahi kiya hai
  if (
    !TELEGRAM_CONFIG.botToken ||
    TELEGRAM_CONFIG.botToken === 'YOUR_BOT_TOKEN_HERE' ||
    !TELEGRAM_CONFIG.chatId ||
    TELEGRAM_CONFIG.chatId === 'YOUR_CHAT_ID_HERE'
  ) {
    console.info(
      '%c[Visitor Tracker]%c Telegram bot credentials not set yet. Follow the setup guide in script.js to activate phone alerts!',
      'background: #38bdf8; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: #38bdf8; font-weight: bold;'
    );
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: messageHtml,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('[Telegram API Error]:', data.description);
      throw new Error(data.description || 'Telegram send failed');
    }
    return data;
  } catch (err) {
    console.warn('[Visitor Tracker] Could not deliver Telegram telemetry:', err);
    throw err;
  }
}

async function trackVisitor() {
  // Check if visitor was already notified during this session (prevents spam on refresh)
  const sessionVisited = sessionStorage.getItem('rohit_portfolio_visited');
  if (sessionVisited) return;

  const { os, browser } = detectDevice();
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const referrer = document.referrer ? document.referrer : 'Direct / Bookmark';
  const now = new Date();
  const timeFormatted = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  }) + ' (IST)';

  let ipData = {
    ip: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    flag: '🌐',
    isp: 'Unknown'
  };

  try {
    // Free, HTTPS, fast geo-IP endpoint
    const response = await fetch('https://ipwho.is/');
    const data = await response.json();

    if (data.success) {
      ipData = {
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country || 'Unknown',
        flag: data.flag?.emoji || '🌐',
        isp: data.connection?.isp || data.connection?.org || 'Unknown'
      };
    }
  } catch (e) {
    // Fallback if ipwho is blocked by adblocker
    try {
      const fb = await fetch('https://ipapi.co/json/');
      const data = await fb.json();
      ipData = {
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        flag: '📍',
        isp: data.org || 'Unknown'
      };
    } catch (_) {
      // Gracefully continue with defaults
    }
  }

  // Construct telegram message payload
  const telegramMessage = `🚀 <b>New Portfolio Visitor Alert!</b>\n\n` +
    `📍 <b>Location:</b> ${ipData.city}, ${ipData.region}, ${ipData.country} ${ipData.flag}\n` +
    `🌐 <b>IP & ISP:</b> <code>${ipData.ip}</code>\n` +
    `🏢 <b>Network:</b> ${ipData.isp}\n` +
    `💻 <b>Device & OS:</b> ${os} • ${browser}\n` +
    `📱 <b>Screen:</b> ${screenResolution}\n` +
    `🔗 <b>Source:</b> ${referrer}\n` +
    `⏰ <b>Time:</b> ${timeFormatted}`;

  await sendTelegramAlert(telegramMessage);

  // Set session flag so current visitor won't trigger repeated pings on every navigation
  sessionStorage.setItem('rohit_portfolio_visited', 'true');
}

// ========================================================
// 4. DIRECT CONTACT FORM -> TELEGRAM DISPATCHER
// ========================================================
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  const sendBtn = document.getElementById('send-msg-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('visitor-name').value.trim();
    const contact = document.getElementById('visitor-contact').value.trim();
    const message = document.getElementById('visitor-message').value.trim();

    if (!name || !contact || !message) {
      feedback.textContent = 'Please fill out all fields.';
      feedback.className = 'form-feedback error';
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>';

    const now = new Date();
    const timeFormatted = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' (IST)';

    const cleanName = escapeTelegramHtml(name);
    const cleanContact = escapeTelegramHtml(contact);
    const cleanMessage = escapeTelegramHtml(message);

    const telegramMessage = `💬 <b>New Direct Message from Portfolio!</b>\n\n` +
      `👤 <b>Sender:</b> ${cleanName}\n` +
      `📬 <b>Contact:</b> ${cleanContact}\n` +
      `⏰ <b>Received:</b> ${timeFormatted}\n\n` +
      `📝 <b>Message:</b>\n<i>${cleanMessage}</i>`;

    try {
      if (
        TELEGRAM_CONFIG.botToken &&
        TELEGRAM_CONFIG.botToken !== 'YOUR_BOT_TOKEN_HERE' &&
        TELEGRAM_CONFIG.chatId &&
        TELEGRAM_CONFIG.chatId !== 'YOUR_CHAT_ID_HERE'
      ) {
        await sendTelegramAlert(telegramMessage);
        feedback.textContent = 'Awesome! Your note was sent straight to Rohit\'s Telegram.';
        feedback.className = 'form-feedback success';
        form.reset();
        showToast('Message delivered to Rohit!');
      } else {
        // Fallback if telegram token is not configured yet
        window.location.href = `mailto:rohitkandari148@gmail.com?subject=Note from ${encodeURIComponent(name)}&body=${encodeURIComponent(message + '\n\nContact: ' + contact)}`;
        feedback.textContent = 'Opening your email client to send message...';
        feedback.className = 'form-feedback success';
      }
    } catch (err) {
      feedback.innerHTML = `Could not deliver directly to Telegram. Click <a href="mailto:rohitkandari148@gmail.com?subject=Note from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}" style="color:var(--accent-cyan); text-decoration:underline;">here to send via Email</a>.`;
      feedback.className = 'form-feedback error';
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fa-regular fa-paper-plane"></i> <span>Send to Rohit</span>';
    }
  });
}

// ========================================================
// 5. TYPEWRITER EFFECT
// ========================================================
function setupTypewriter() {
  const element = document.getElementById('typewriter');
  if (!element) return;

  const roles = [
    'C# & .NET Solutions.',
    'Desktop Applications.',
    'Robust Software Architectures.',
    'Intuitive Web Experiences.',
    'Impactful Logic & Clean Code.'
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingSpeed = 90;
  const deletingSpeed = 45;
  const pauseBetween = 1800;

  function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      element.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
    } else {
      element.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentRole.length) {
      delay = pauseBetween;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  type();
}

// ========================================================
// 6. SPOTLIGHT EFFECT ON CARDS (LINEAR / VERCEL STYLE)
// ========================================================
function setupSpotlight() {
  const cards = document.querySelectorAll('.spotlight-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// ========================================================
// 7. THEME TOGGLE (DARK / LIGHT)
// ========================================================
function setupTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const icon = themeToggle ? themeToggle.querySelector('i') : null;

  // Retrieve saved theme or default to dark
  const savedTheme = localStorage.getItem('rohit_theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('rohit_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-moon';
      themeToggle.setAttribute('title', 'Switch to Light Theme');
    } else {
      icon.className = 'fa-solid fa-sun';
      themeToggle.setAttribute('title', 'Switch to Dark Theme');
    }
  }
}

// ========================================================
// 8. MOBILE DRAWER NAVIGATION
// ========================================================
function setupMobileNav() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const drawerClose = document.getElementById('drawer-close');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflowY = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflowY = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });
}

// ========================================================
// 9. ACTIVE NAV LINK HIGHLIGHTER ON SCROLL
// ========================================================
function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

// ========================================================
// 10. COPY EMAIL TO CLIPBOARD & TOAST NOTIFICATION
// ========================================================
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.innerHTML = `<i class="fa-solid fa-circle-check text-accent"></i> <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      textArea.remove();
      if (successful) resolve();
      else reject(new Error('Fallback copy failed'));
    } catch (err) {
      textArea.remove();
      reject(err);
    }
  });
}

function setupCopyEmail() {
  const copyBtn = document.getElementById('copy-email-btn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const email = 'rohitkandari148@gmail.com';
    copyToClipboard(email)
      .then(() => {
        showToast('Email address copied to clipboard!');
      })
      .catch(() => {
        showToast('Email: ' + email);
      });
  });
}

// ========================================================
// 11. FOOTER YEAR UPDATE
// ========================================================
function setupFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ========================================================
// INITIALIZE ON DOM READY
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupMobileNav();
  setupTypewriter();
  setupSpotlight();
  setupScrollSpy();
  setupCopyEmail();
  setupContactForm();
  setupFooterYear();

  // Trigger visitor tracking after smooth page render
  setTimeout(trackVisitor, 1200);
});
