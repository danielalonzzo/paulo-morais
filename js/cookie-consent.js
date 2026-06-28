/**
 * Cookie Consent Banner — RGPD / ePrivacy Compliant
 * Paulo Morais · pmorais.pt
 * Directiva ePrivacy 2002/58/CE + RGPD (UE) 2016/679
 */

(function () {
  'use strict';

  const CONSENT_KEY = 'pm_cookie_consent';
  const CONSENT_VERSION = '1.0';

  /* ── Detect language ─────────────────────────────────────── */
  const isEN = window.location.pathname.startsWith('/en/') || window.location.pathname === '/en';

  const strings = {
    pt: {
      title: 'Utilizamos cookies 🍪',
      body: 'Usamos cookies essenciais para o funcionamento do site e, com o seu consentimento, cookies analíticos para melhorar a sua experiência. Pode gerir as suas preferências a qualquer momento.',
      acceptAll: 'Aceitar Todos',
      rejectAll: 'Rejeitar Não Essenciais',
      manage: 'Gerir Preferências',
      manageTitle: 'Gerir Preferências de Cookies',
      essential: 'Cookies Essenciais',
      essentialDesc: 'Necessários para o funcionamento do site. Não podem ser desativados.',
      analytics: 'Cookies Analíticos',
      analyticsDesc: 'Ajudam-nos a perceber como utiliza o site (Google Analytics, etc.). Só são ativados com o seu consentimento.',
      savePrefs: 'Guardar Preferências',
      privacyLink: '/politica-privacidade.html',
      privacyText: 'Política de Privacidade',
    },
    en: {
      title: 'We use cookies 🍪',
      body: 'We use essential cookies for the website to function and, with your consent, analytics cookies to improve your experience. You can manage your preferences at any time.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject Non-Essential',
      manage: 'Manage Preferences',
      manageTitle: 'Manage Cookie Preferences',
      essential: 'Essential Cookies',
      essentialDesc: 'Required for the website to function. Cannot be disabled.',
      analytics: 'Analytics Cookies',
      analyticsDesc: 'Help us understand how you use the site. Only activated with your consent.',
      savePrefs: 'Save Preferences',
      privacyLink: '/en/politica-privacidade.html',
      privacyText: 'Privacy Policy',
    }
  };

  const t = isEN ? strings.en : strings.pt;

  /* ── Check existing consent ──────────────────────────────── */
  function getConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== CONSENT_VERSION) return null;
      return data;
    } catch (e) { return null; }
  }

  function saveConsent(analytics) {
    const data = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: analytics
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    return data;
  }

  /* ── Inject CSS ──────────────────────────────────────────── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #pm-cookie-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        background: var(--color-surface, #1a1a1a);
        border-top: 1px solid rgba(230,174,23,0.25);
        padding: 20px 24px;
        box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
        font-family: 'Poppins', 'Montserrat', sans-serif;
        animation: pm-slide-up 0.4s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes pm-slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      #pm-cookie-banner .pm-cookie-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      #pm-cookie-banner .pm-cookie-text {
        flex: 1;
        min-width: 260px;
      }
      #pm-cookie-banner .pm-cookie-text h3 {
        color: var(--color-primary, #E6AE17);
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 6px;
        letter-spacing: 0.3px;
      }
      #pm-cookie-banner .pm-cookie-text p {
        color: var(--color-text-dim, #aaa);
        font-size: 0.82rem;
        margin: 0;
        line-height: 1.5;
      }
      #pm-cookie-banner .pm-cookie-text a {
        color: var(--color-primary, #E6AE17);
        text-decoration: underline;
      }
      #pm-cookie-banner .pm-cookie-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        flex-shrink: 0;
      }
      #pm-cookie-banner .pm-btn {
        padding: 10px 20px;
        border-radius: 50px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        white-space: nowrap;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      #pm-cookie-banner .pm-btn-accept {
        background: var(--color-primary, #E6AE17);
        color: #000;
      }
      #pm-cookie-banner .pm-btn-accept:hover {
        background: #d4a016;
        transform: translateY(-1px);
      }
      #pm-cookie-banner .pm-btn-reject {
        background: transparent;
        color: var(--color-text-dim, #aaa);
        border: 1px solid rgba(255,255,255,0.15);
      }
      #pm-cookie-banner .pm-btn-reject:hover {
        border-color: rgba(255,255,255,0.35);
        color: var(--color-text, #fff);
      }
      #pm-cookie-banner .pm-btn-manage {
        background: transparent;
        color: var(--color-text-dim, #888);
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 0.75rem;
      }
      #pm-cookie-banner .pm-btn-manage:hover {
        border-color: var(--color-primary, #E6AE17);
        color: var(--color-primary, #E6AE17);
      }

      /* Modal */
      #pm-cookie-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(6px);
        align-items: center;
        justify-content: center;
      }
      #pm-cookie-modal.open { display: flex; }
      #pm-cookie-modal .pm-modal-box {
        background: var(--color-surface, #1a1a1a);
        border: 1px solid rgba(230,174,23,0.2);
        border-radius: 20px;
        padding: 36px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }
      #pm-cookie-modal h3 {
        color: var(--color-primary, #E6AE17);
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 24px;
        font-family: 'Poppins', sans-serif;
      }
      .pm-pref-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .pm-pref-row:last-of-type { border-bottom: none; }
      .pm-pref-label strong {
        display: block;
        color: var(--color-text, #fff);
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 4px;
        font-family: 'Poppins', sans-serif;
      }
      .pm-pref-label span {
        color: var(--color-text-dim, #888);
        font-size: 0.78rem;
        line-height: 1.4;
        font-family: 'Poppins', sans-serif;
      }
      /* Toggle switch */
      .pm-toggle {
        position: relative;
        flex-shrink: 0;
        width: 44px;
        height: 24px;
      }
      .pm-toggle input { opacity: 0; width: 0; height: 0; }
      .pm-toggle-slider {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.1);
        border-radius: 24px;
        cursor: pointer;
        transition: 0.3s;
      }
      .pm-toggle-slider:before {
        content: '';
        position: absolute;
        width: 18px; height: 18px;
        left: 3px; top: 3px;
        background: #fff;
        border-radius: 50%;
        transition: 0.3s;
      }
      .pm-toggle input:checked + .pm-toggle-slider { background: var(--color-primary, #E6AE17); }
      .pm-toggle input:checked + .pm-toggle-slider:before { transform: translateX(20px); }
      .pm-toggle input:disabled + .pm-toggle-slider { opacity: 0.4; cursor: not-allowed; }
      .pm-modal-actions {
        margin-top: 28px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      @media (max-width: 600px) {
        #pm-cookie-banner .pm-cookie-inner { flex-direction: column; align-items: flex-start; }
        #pm-cookie-banner .pm-cookie-actions { width: 100%; }
        #pm-cookie-banner .pm-btn { flex: 1; text-align: center; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Build Banner HTML ───────────────────────────────────── */
  function buildBanner() {
    const banner = document.createElement('div');
    banner.id = 'pm-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.title);
    banner.innerHTML = `
      <div class="pm-cookie-inner">
        <div class="pm-cookie-text">
          <h3>${t.title}</h3>
          <p>${t.body} <a href="${t.privacyLink}" target="_blank" rel="noopener">${t.privacyText}</a>.</p>
        </div>
        <div class="pm-cookie-actions">
          <button class="pm-btn pm-btn-accept" id="pm-accept-all">${t.acceptAll}</button>
          <button class="pm-btn pm-btn-reject" id="pm-reject-all">${t.rejectAll}</button>
          <button class="pm-btn pm-btn-manage" id="pm-manage">${t.manage}</button>
        </div>
      </div>
    `;
    return banner;
  }

  /* ── Build Manage Modal ──────────────────────────────────── */
  function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'pm-cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', t.manageTitle);
    modal.innerHTML = `
      <div class="pm-modal-box">
        <h3>${t.manageTitle}</h3>
        <div class="pm-pref-row">
          <div class="pm-pref-label">
            <strong>${t.essential}</strong>
            <span>${t.essentialDesc}</span>
          </div>
          <label class="pm-toggle">
            <input type="checkbox" checked disabled>
            <span class="pm-toggle-slider"></span>
          </label>
        </div>
        <div class="pm-pref-row">
          <div class="pm-pref-label">
            <strong>${t.analytics}</strong>
            <span>${t.analyticsDesc}</span>
          </div>
          <label class="pm-toggle">
            <input type="checkbox" id="pm-analytics-toggle">
            <span class="pm-toggle-slider"></span>
          </label>
        </div>
        <div class="pm-modal-actions">
          <button class="pm-btn pm-btn-reject" id="pm-modal-close" style="font-size:0.78rem">✕</button>
          <button class="pm-btn pm-btn-accept" id="pm-save-prefs">${t.savePrefs}</button>
        </div>
      </div>
    `;
    return modal;
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    const existing = getConsent();
    if (existing) return; // Already consented — skip banner

    injectStyles();
    const banner = buildBanner();
    const modal  = buildModal();
    document.body.appendChild(banner);
    document.body.appendChild(modal);

    /* Accept all */
    document.getElementById('pm-accept-all').addEventListener('click', function () {
      saveConsent(true);
      hideBanner();
    });

    /* Reject non-essential */
    document.getElementById('pm-reject-all').addEventListener('click', function () {
      saveConsent(false);
      hideBanner();
    });

    /* Open manage modal */
    document.getElementById('pm-manage').addEventListener('click', function () {
      modal.classList.add('open');
    });

    /* Close modal */
    document.getElementById('pm-modal-close').addEventListener('click', function () {
      modal.classList.remove('open');
    });

    /* Close modal clicking backdrop */
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('open');
    });

    /* Save preferences from modal */
    document.getElementById('pm-save-prefs').addEventListener('click', function () {
      const analyticsChecked = document.getElementById('pm-analytics-toggle').checked;
      saveConsent(analyticsChecked);
      modal.classList.remove('open');
      hideBanner();
    });
  }

  function hideBanner() {
    const banner = document.getElementById('pm-cookie-banner');
    if (banner) {
      banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 350);
    }
  }

  /* Run after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
