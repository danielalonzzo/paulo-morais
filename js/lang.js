/*
 * Language detection and routing logic
 * Automatically detects Romance languages -> defaults to PT
 * Other languages -> defaults to EN
 */

(function() {
    // List of Romance language codes (ISO 639-1)
    const romanceLangs = ['pt', 'es', 'fr', 'it', 'ro', 'ca', 'gl'];
    
    // Get stored preference or detect from browser
    let preferredLang = localStorage.getItem('pm_lang_pref');
    
    if (!preferredLang) {
        // Detect from browser
        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase().split('-')[0];
        if (romanceLangs.includes(browserLang)) {
            preferredLang = 'pt';
        } else {
            preferredLang = 'en';
        }
        // Do not save to localStorage automatically to allow browser language changes to reflect,
        // unless they explicitly toggled it.
    }

    const currentPath = window.location.pathname;
    const isEnPage = currentPath.startsWith('/en/') || currentPath === '/en';

    // Redirect logic
    if (preferredLang === 'en' && !isEnPage) {
        // Redirect to EN
        // Avoid redirecting if it's not an HTML page or root
        if (currentPath.endsWith('.html') || currentPath.endsWith('/') || currentPath === '') {
            let newPath = '/en' + currentPath;
            window.location.replace(newPath);
        }
    } else if (preferredLang === 'pt' && isEnPage) {
        // Redirect to PT
        let newPath = currentPath.replace(/^\/en\/?/, '/');
        if (newPath === '') newPath = '/';
        window.location.replace(newPath);
    }
})();

window.toggleLanguage = function() {
    const currentPath = window.location.pathname;
    const isEnPage = currentPath.startsWith('/en/') || currentPath === '/en';
    
    if (isEnPage) {
        // Switch to PT
        localStorage.setItem('pm_lang_pref', 'pt');
        let newPath = currentPath.replace(/^\/en\/?/, '/');
        if (newPath === '') newPath = '/';
        window.location.href = newPath;
    } else {
        // Switch to EN
        localStorage.setItem('pm_lang_pref', 'en');
        let newPath = '/en' + currentPath;
        window.location.href = newPath;
    }
};
