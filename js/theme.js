/*
 * Theme logic for Paulo Morais Website
 * Implements dynamic light/dark mode based on the user's local time,
 * with manual override capabilities (light/dark/auto).
 */

function applyDynamicTheme() {
    // Check manual override
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
    const logos = document.querySelectorAll('.logo-img, .footer-logo-elysium, .logo-img-small, .footer-logo, .contact-form-logo');
    logos.forEach(logo => {
        const currentSrc = logo.getAttribute('src');
        if (isLightMode) {
            if (currentSrc && !currentSrc.includes('paulo_morais-08.png')) {
                logo.src = 'images/logo/paulo_morais-08.png';
            }
        } else {
            if (currentSrc && !currentSrc.includes('logo_amarelo_alpha.png')) {
                logo.src = 'images/logo/logo_amarelo_alpha.png';
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
            logo.src = 'images/claro/' + targetFilename;
        } else {
            logo.src = originalSrc;
        }
    });

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
    const isActuallyLight = document.querySelector('img.logo-img').src.includes('paulo_morais-08.png');
    
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
});

// Continuous update every minute for auto mode
setInterval(applyDynamicTheme, 60000);
