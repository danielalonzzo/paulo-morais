/*
 * Theme logic for Paulo Morais Website
 * Implements dynamic light/dark mode based on the user's local time,
 * with manual override capabilities (light/dark/auto).
 */

function applyDynamicTheme() {
    // Check manual override
    const savedTheme = localStorage.getItem('theme');
    
    setTimeout(() => {
        updateFabPositions();
    }, 100);
    
    const manualMode = localStorage.getItem('theme_mode') || 'auto'; // 'light', 'dark', 'auto'
    
    // Premium Dark Mode Defaults
    let bgRGB = [11, 11, 11]; // #0B0B0B - Deep black
    let surfaceRGB = [24, 24, 26]; // #18181A - Elevated dark surface
    let textRGB = [245, 245, 247]; // #F5F5F7 - Soft white (easier on eyes than pure #FFF)
    let textDimRGB = [161, 161, 166]; // #A1A1A6 - Elegant muted text
    let accentRGB = [245, 245, 247]; 
    let osteoRGB = [245, 245, 247];
    let heroLegalOverlay = 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(30, 30, 30, 0.85))';

    const setLightMode = () => {
        // Premium Light Mode (Apple-esque minimalistic palette)
        bgRGB = [250, 250, 250]; // #FAFAFA - Crisp, elegant off-white
        surfaceRGB = [255, 255, 255]; // #FFFFFF - Pure white elevating cards/sections
        textRGB = [29, 29, 31]; // #1D1D1F - Rich charcoal (softer contrast than raw black)
        textDimRGB = [110, 110, 115]; // #6E6E73 - Premium mid-grey for secondary text
        accentRGB = [29, 29, 31]; 
        osteoRGB = [29, 29, 31]; 
        heroLegalOverlay = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
    };

    if (manualMode === 'light') {
        setLightMode();
    } else if (manualMode === 'dark') {
        // Keeps default dark values
    } else {
        // Auto mode: Light from 6 AM to 4 PM, Dark otherwise
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        
        const startLight = 6 * 60;  // 6:00 AM
        const startDark = 16 * 60;  // 4:00 PM
        
        if (timeInMinutes >= startLight && timeInMinutes < startDark) {
            setLightMode();
        } else {
            // It's after 4 PM or before 6 AM: keep default dark mode values
        }
    }
    
    // Apply CSS Variables directly to the :root element
    document.documentElement.style.setProperty('--color-bg', `rgb(${bgRGB.join(',')})`);
    document.documentElement.style.setProperty('--color-surface', `rgb(${surfaceRGB.join(',')})`);
    document.documentElement.style.setProperty('--color-text', `rgb(${textRGB.join(',')})`);
    document.documentElement.style.setProperty('--color-text-dim', `rgb(${textDimRGB.join(',')})`);
    document.documentElement.style.setProperty('--color-accent', `rgb(${accentRGB.join(',')})`);
    document.documentElement.style.setProperty('--color-osteo', `rgb(${osteoRGB.join(',')})`);
    document.documentElement.style.setProperty('--hero-legal-overlay', heroLegalOverlay);
    
    // Inject smooth transition styles gracefully (if not present)
    if (!document.getElementById('theme-transition-styles')) {
        const style = document.createElement('style');
        style.id = 'theme-transition-styles';
        style.textContent = `
            .theme-transitioning,
            .theme-transitioning * {
                transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out, border-color 0.5s ease-in-out, border 0.5s ease-in-out, box-shadow 0.5s ease-in-out, fill 0.5s ease-in-out, stroke 0.5s ease-in-out !important;
            }
            @keyframes icon-pop {
                0% { transform: scale(0.5) rotate(-30deg); opacity: 0; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            #theme-toggle svg {
                animation: icon-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
        `;
        document.head.appendChild(style);
    }

    // Update logos
    const isLightMode = bgRGB[0] > 127; // Threshold for "Light"

    // Toggle body classes for CSS targeting
    if (document.body) {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        }
    }
    const basePath = window.location.pathname.includes('/en/') ? '../' : '';
    const logos = document.querySelectorAll('.logo-img, .footer-logo-elysium, .logo-img-small, .footer-logo, .contact-form-logo');
    logos.forEach(logo => {
        const currentSrc = logo.getAttribute('src');
        if (isLightMode) {
            if (currentSrc && !currentSrc.includes('paulo_morais-08.png')) {
                logo.src = basePath + 'images/logo/paulo_morais-08.png';
            }
        } else {
            if (currentSrc && !currentSrc.includes('logo_amarelo_alpha.png')) {
                logo.src = basePath + 'images/logo/logo_amarelo_alpha.png';
            }
        }
    });

    // Update Partner Logos
    const partnerLogos = document.querySelectorAll('.partners-track img');
    partnerLogos.forEach(logo => {
        if (!logo.hasAttribute('data-original-src')) {
            logo.setAttribute('data-original-src', logo.getAttribute('src') || '');
        }
        
        const originalSrc = logo.getAttribute('data-original-src');
        if (!originalSrc) return;
        const filename = originalSrc.split('/').pop();
        
        if (isLightMode) {
            let targetFilename = filename;
            if (filename === 'livro-de-reclamacoes.png') targetFilename = 'livro_de_reclamacoes.png';
            logo.src = basePath + 'images/claro/' + targetFilename;
        } else {
            logo.src = originalSrc;
        }
    });

    // Update iPad video on Osteopatia page
    const ipadVideo = document.querySelector('.page-osteopatia .ipad-video-iframe video');
    if (ipadVideo) {
        const targetVideoSrc = basePath + (isLightMode ? 'images/osteopatia/ipadclaro.mp4' : 'images/osteopatia/ipad.mp4');
        const currentSrc = ipadVideo.src || '';
        
        if (!currentSrc.endsWith(targetVideoSrc)) {
            // Set directly on the video element for cross-browser compatibility
            ipadVideo.src = targetVideoSrc;
            
            // Also update the source tag for semantic consistency
            const source = ipadVideo.querySelector('source');
            if (source) {
                source.setAttribute('src', targetVideoSrc);
            }
            
            ipadVideo.load();
            if (ipadVideo.hasAttribute('autoplay')) {
                ipadVideo.play().catch(e => console.log("Playback interrupted or blocked"));
            }
        }
    }

    // Update the icon - FIX: Lucide replaces <i> with <svg>, so we must search for both
    const toggleBtnIcon = document.querySelector('#theme-toggle i, #theme-toggle svg');
    if (toggleBtnIcon) {
        // Use sun if light mode (manual or auto), moon if dark mode
        let iconName = isLightMode ? 'sun' : 'moon';
        
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        toggleBtnIcon.parentNode.replaceChild(newIcon, toggleBtnIcon);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Global toggle logic to be called by script.js button
window.toggleThemeMode = function() {
    // Add transition class to html for broader coverage
    document.documentElement.classList.add('theme-transitioning');
    
    const currentMode = localStorage.getItem('theme_mode') || 'auto';
    let newMode = 'light';
    
    // Simplified Cycle: if currently light (or auto-light), go to dark. Otherwise go to light.
    // This removes the "auto" step from manual cycling.
    const isActuallyLight = document.body.classList.contains('light-mode');
    
    if (isActuallyLight) {
        newMode = 'dark';
    } else {
        newMode = 'light';
    }
    
    localStorage.setItem('theme_mode', newMode);
    applyDynamicTheme();
    
    // Remove transition class after it's done (600ms to be safe)
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
    }, 600);
};

// Initial application for CSS variables (immediate)
applyDynamicTheme();

// Ensure logos/icons update once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applyDynamicTheme();
    injectPwaInstallButton();
    maybeAutoShowPwaTutorial();
});

// Continuous update every minute for auto mode
setInterval(applyDynamicTheme, 60000);

// Global deferred prompt for PWA installation
let deferredPrompt;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const PWA_DISMISSED_KEY = 'pm_pwa_tutorial_dismissed';
let pwaCurrentSlide = 0;
let pwaTotalSlides = 3;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA installation prompt captured.');
    
    // Ensure button is injected
    injectPwaInstallButton();
});

function injectPwaInstallButton() {
    if (isStandalone) return;
    
    if (localStorage.getItem('pm_is_logged_in') !== 'true') {
        const existingBtn = document.getElementById('pwa-install-btn');
        if (existingBtn) existingBtn.remove();
        return;
    }
    
    const fabOptions = document.querySelector('.fab-options');
    if (!fabOptions) return;
    
    // Check if button already exists
    if (document.getElementById('pwa-install-btn')) return;
    
    const pwaBtn = document.createElement('a');
    pwaBtn.href = 'javascript:void(0)';
    pwaBtn.id = 'pwa-install-btn';
    pwaBtn.className = 'fab-action-btn pwa-install';
    pwaBtn.title = 'Instalar App';
    pwaBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openPwaTutorial();
    };
    
    pwaBtn.innerHTML = '<i data-lucide="download"></i>';
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        fabOptions.insertBefore(pwaBtn, themeToggle);
    } else {
        fabOptions.appendChild(pwaBtn);
    }
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    updateFabPositions();
}

function updateFabPositions() {
    const slots = [];
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) slots.push(themeBtn);
    const pwaBtn = document.getElementById('pwa-install-btn');
    if (pwaBtn) slots.push(pwaBtn);
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) slots.push(langBtn);
    
    slots.forEach((btn, index) => {
        btn.style.right = (75 + index * 65) + 'px';
    });
}

function injectPwaInstallOverlay() {
    if (document.getElementById('pwa-install-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'pwa-install-overlay';
    overlay.className = 'booking-tutorial-overlay';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let slidesHTML = '';
    
    if (isIOS) {
        pwaTotalSlides = 4;
        slidesHTML = `
            <!-- Slide 0: Welcome -->
            <div class="tutorial-slide active" data-pwa-slide="0">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <span class="tutorial-step-badge">Instalar App</span>
                    <h3 class="tutorial-slide-title">Adicione ao seu Ecrã</h3>
                    <p class="tutorial-slide-desc">
                        Adicione a App do <strong>Paulo Morais</strong> ao seu ecrã principal para aceder rapidamente aos treinos e marcações.<br><br>
                        É simples, rápido e não ocupa espaço de armazenamento!
                    </p>
                </div>
            </div>
            <!-- Slide 1: Partilhar -->
            <div class="tutorial-slide" data-pwa-slide="1">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="share"></i>
                    </div>
                    <span class="tutorial-step-badge">Step 1</span>
                    <h3 class="tutorial-slide-title">Toque em Partilhar</h3>
                    <p class="tutorial-slide-desc">
                        No navegador Safari, toque no botão <strong>Partilhar</strong> na barra inferior do seu ecrã (o ícone de um quadrado com uma seta para cima).
                    </p>
                    <div class="tutorial-tip">
                        <i data-lucide="info"></i>
                        <span>Este botão está normalmente no centro da barra inferior do Safari no seu iPhone.</span>
                    </div>
                </div>
            </div>
            <!-- Slide 2: Adicionar ao ecrã principal -->
            <div class="tutorial-slide" data-pwa-slide="2">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="plus-square"></i>
                    </div>
                    <span class="tutorial-step-badge">Step 2</span>
                    <h3 class="tutorial-slide-title">Ecrã Principal</h3>
                    <p class="tutorial-slide-desc">
                        No menu de partilha, deslize para baixo e selecione a opção <strong>"Adicionar ao Ecrã Principal"</strong>.
                    </p>
                </div>
            </div>
            <!-- Slide 3: Concluir -->
            <div class="tutorial-slide" data-pwa-slide="3">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <span class="tutorial-step-badge">Step 3</span>
                    <h3 class="tutorial-slide-title">Confirmar e Usar!</h3>
                    <p class="tutorial-slide-desc">
                        Tap <strong>"Add"</strong> in the top right corner to confirm. The icon will appear on your phone and will be ready to use.
                    </p>
                </div>
            </div>
        `;
    } else {
        pwaTotalSlides = 3;
        slidesHTML = `
            <!-- Slide 0: Welcome -->
            <div class="tutorial-slide active" data-pwa-slide="0">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <span class="tutorial-step-badge">Instalar App</span>
                    <h3 class="tutorial-slide-title">Paulo Morais no seu Phone</h3>
                    <p class="tutorial-slide-desc">
                        Instale a nossa aplicação para aceder diretamente aos seus treinos, agendamentos e gerir o seu perfil de forma rápida e fluida.
                    </p>
                    <div class="tutorial-tip" id="android-install-tip-box" style="display:none;">
                        <i data-lucide="check-circle-2"></i>
                        <span>Compatível com o seu dispositivo! Toque em 'Instalar' na slide seguinte para configurar instantaneamente.</span>
                    </div>
                </div>
            </div>
            <!-- Slide 1: Install Action -->
            <div class="tutorial-slide" data-pwa-slide="1">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="download"></i>
                    </div>
                    <span class="tutorial-step-badge">Instalação</span>
                    <h3 class="android-prompt-title" style="font-size: 1.35rem; font-weight: 800; color: var(--color-text); text-align: center; margin-bottom: 14px; line-height: 1.3;">Direct Installation</h3>
                    <p class="android-prompt-desc" style="font-size: 0.92rem; color: var(--color-text-dim); text-align: center; line-height: 1.7; margin-bottom: 0;">
                        Click the button below to install the application directly to your phone automatically.
                    </p>
                    
                    <div id="pwa-install-prompt-action-div" style="margin-top: 25px; text-align: center;">
                        <button id="pwa-native-install-btn" class="tutorial-btn tutorial-btn-start" style="max-width: 100%; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                            Instalar Agora
                        </button>
                    </div>

                    <div id="pwa-manual-install-instructions" style="display:none; text-align: left; margin-top: 15px;">
                        <p class="tutorial-slide-desc" style="text-align: center;">
                            Para instalar manualmente, toque no menu de <strong>três pontos</strong> <i data-lucide="more-vertical" style="display:inline-block; width:16px; height:16px; vertical-align:middle;"></i> no canto superior direito do navegador e selecione <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã principal"</strong>.
                        </p>
                    </div>
                </div>
            </div>
            <!-- Slide 2: Concluir -->
            <div class="tutorial-slide" data-pwa-slide="2">
                <div style="text-align:center;">
                    <div class="tutorial-slide-icon">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <span class="tutorial-step-badge">Concluído</span>
                    <h3 class="tutorial-slide-title">Pronto a Utilizar!</h3>
                    <p class="tutorial-slide-desc">
                        After confirming the installation, the Paulo Morais App icon will appear on your device's screen. Access it anytime with a single tap!
                    </p>
                </div>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div class="tutorial-card">
            <button class="tutorial-close-btn" onclick="closePwaTutorial()" title="Close">
                <i data-lucide="x"></i>
            </button>
            
            <!-- Indicators -->
            <div class="tutorial-indicators" id="pwa-indicators"></div>
            
            <!-- Slides -->
            <div class="tutorial-slides-wrapper" id="pwa-slides-wrapper">
                ${slidesHTML}
            </div>
            
            <!-- Navigation -->
            <div class="tutorial-nav" id="pwa-nav"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    if (!isIOS) {
        const nativeBtn = document.getElementById('pwa-native-install-btn');
        if (nativeBtn) {
            nativeBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to install prompt: ${outcome}`);
                    deferredPrompt = null;
                    closePwaTutorial();
                } else {
                    alert('Please use the browser menu to install manually.');
                }
            });
        }
    }
}

function initPwaIndicators() {
    const container = document.getElementById('pwa-indicators');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < pwaTotalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = `tutorial-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToPwaSlide(i);
        container.appendChild(dot);
    }
}

function updatePwaIndicators() {
    const dots = document.querySelectorAll('#pwa-indicators .tutorial-dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === pwaCurrentSlide) {
            dot.classList.add('active');
        } else if (i < pwaCurrentSlide) {
            dot.classList.add('completed');
        }
    });
}

function updatePwaNav() {
    const nav = document.getElementById('pwa-nav');
    if (!nav) return;
    
    const isLast = pwaCurrentSlide === pwaTotalSlides - 1;
    const isFirst = pwaCurrentSlide === 0;
    
    let html = '';
    if (isFirst) {
        html += `<button class="tutorial-btn tutorial-btn-skip" onclick="closePwaTutorial()">Skip</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-prev" onclick="prevPwaSlide()"><i data-lucide="arrow-left"></i> Anterior</button>`;
    }
    
    if (isLast) {
        html += `<button class="tutorial-btn tutorial-btn-start" onclick="closePwaTutorial()">Concluir</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-next" onclick="nextPwaSlide()">Next <i data-lucide="arrow-right"></i></button>`;
    }
    
    nav.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

function goToPwaSlide(index) {
    if (index < 0 || index >= pwaTotalSlides || index === pwaCurrentSlide) return;
    
    const slides = document.querySelectorAll('#pwa-slides-wrapper .tutorial-slide');
    const currentSlide = slides[pwaCurrentSlide];
    const nextSlide = slides[index];
    if (!currentSlide || !nextSlide) return;
    
    const goingForward = index > pwaCurrentSlide;
    
    currentSlide.classList.remove('active');
    currentSlide.classList.add(goingForward ? 'exit-left' : '');
    currentSlide.style.transform = goingForward ? 'translateX(-60px)' : 'translateX(60px)';
    
    nextSlide.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
    nextSlide.style.opacity = '0';
    
    setTimeout(() => {
        currentSlide.classList.remove('exit-left');
        currentSlide.style.transform = '';
        currentSlide.style.opacity = '';
        
        nextSlide.classList.add('active');
        nextSlide.style.transform = '';
        nextSlide.style.opacity = '';
    }, 50);
    
    pwaCurrentSlide = index;
    updatePwaIndicators();
    updatePwaNav();
}

function nextPwaSlide() {
    goToPwaSlide(pwaCurrentSlide + 1);
}

function prevPwaSlide() {
    goToPwaSlide(pwaCurrentSlide - 1);
}

function openPwaTutorial() {
    injectPwaInstallOverlay();
    
    pwaCurrentSlide = 0;
    
    const slides = document.querySelectorAll('#pwa-slides-wrapper .tutorial-slide');
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'exit-left');
        slide.style.transform = '';
        slide.style.opacity = '';
        if (i === 0) slide.classList.add('active');
    });
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
        const actionDiv = document.getElementById('pwa-install-prompt-action-div');
        const manualDiv = document.getElementById('pwa-manual-install-instructions');
        const titleEl = document.querySelector('.android-prompt-title');
        const descEl = document.querySelector('.android-prompt-desc');
        const tipEl = document.getElementById('android-install-tip-box');
        
        if (deferredPrompt) {
            if (actionDiv) actionDiv.style.display = 'block';
            if (manualDiv) manualDiv.style.display = 'none';
            if (titleEl) titleEl.innerText = 'Direct Installation';
            if (descEl) descEl.innerText = 'Click the button below to install the application directly to your phone automatically.';
            if (tipEl) tipEl.style.display = 'flex';
        } else {
            if (actionDiv) actionDiv.style.display = 'none';
            if (manualDiv) manualDiv.style.display = 'block';
            if (titleEl) titleEl.innerText = 'Add Manually';
            if (descEl) descEl.innerText = 'Automatic direct installation is not available in your current browser.';
            if (tipEl) tipEl.style.display = 'none';
        }
    }
    
    initPwaIndicators();
    updatePwaNav();
    
    const overlay = document.getElementById('pwa-install-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    if (window.lucide) window.lucide.createIcons();
}

function closePwaTutorial() {
    const overlay = document.getElementById('pwa-install-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    try {
        localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    } catch (e) {
        console.warn('Could not save PWA state to localStorage:', e);
    }
}

function maybeAutoShowPwaTutorial() {
    if (isStandalone) return;
    
    if (localStorage.getItem('pm_is_logged_in') !== 'true') return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    try {
        const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
        if (dismissed === 'true') return;
    } catch (e) {
        console.warn(e);
    }
    
    setTimeout(() => {
        const currentStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (!currentStandalone) {
            openPwaTutorial();
        }
    }, 4000);
}

// Expose functions to window
window.closePwaTutorial = closePwaTutorial;
window.nextPwaSlide = nextPwaSlide;
window.prevPwaSlide = prevPwaSlide;
window.openPwaTutorial = openPwaTutorial;
window.injectPwaInstallButton = injectPwaInstallButton;
window.maybeAutoShowPwaTutorial = maybeAutoShowPwaTutorial;

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

