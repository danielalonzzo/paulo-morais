import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.loadPublicReviews = async function(serviceType) {
    try {
        const q = query(collection(db, "reviews"), where("service", "==", serviceType));
        const snap = await getDocs(q);
        
        let dbReviews = [];
        let verifiedNames = new Set();
        
        snap.forEach(doc => {
            const data = doc.data();
            // Always add the userName to verifiedNames so static HTML cards get the badge
            if (data.userName) {
                verifiedNames.add(data.userName.trim().toUpperCase());
            }
            if (data.isFromHTML) return; // Skip rendering HTML-migrated reviews (avoid duplicate cards)
            dbReviews.push(data);
        });
        
        const profilesSnap = await getDocs(collection(db, "publicProfiles"));
        let registeredNames = new Set();
        profilesSnap.forEach(p => {
            if (p.data().name) registeredNames.add(p.data().name.trim().toUpperCase());
        });
        
        const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 6px; margin-bottom: 3px; flex-shrink: 0; color: #34c759; filter: drop-shadow(0 0 3px rgba(52,199,89,0.5));" title="Cliente Verificado"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.76 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" stroke="#34c759" fill="rgba(52,199,89,0.12)"/><path d="m9 12 2 2 4-4" stroke="#34c759" fill="none"/></svg>`;
        
        const htmlNames = document.querySelectorAll('.testimonial-name');
        htmlNames.forEach(h4 => {
            const name = h4.textContent.trim().toUpperCase();
            if (registeredNames.has(name) || verifiedNames.has(name)) {
                if (!h4.innerHTML.includes('svg')) {
                    h4.innerHTML += badgeSvg;
                }
            }
        });
        
        const carousel = document.querySelector('.testimonial-carousel-wrapper');
        const dotsContainer = document.querySelector('.carousel-dots');
        if (!carousel) return;
        
        const existingCards = carousel.querySelectorAll('[class^="testimonial-card-"]');
        let nextIndex = existingCards.length;
        
        dbReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        dbReviews.forEach(r => {
            const isPt = document.documentElement.lang !== 'en';
            const cardClass = serviceType === 'osteopatia' ? 'testimonial-card-yellow' : 'testimonial-card-green';

            const div = document.createElement('div');
            div.className = cardClass;
            div.setAttribute('data-index', nextIndex);

            const d = new Date(r.timestamp);
            const dateStr = isPt ? `AVALIAÇÃO DE ${d.getFullYear()}` : `REVIEW FROM ${d.getFullYear()}`;

            // Build stars SVG (static markup — no user data)
            let starsHtml = '';
            const rating = Math.min(5, Math.max(0, parseInt(r.rating, 10) || 0));
            for (let i = 1; i <= 5; i++) {
                const filled = i <= rating;
                starsHtml += `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${filled ? '#E6AE17' : 'none'}" stroke="${filled ? '#E6AE17' : '#ddd'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px;" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
            }

            // [SEC-01] Construct content via safe DOM API — no innerHTML with user data.
            // textContent automatically HTML-escapes all characters, preventing XSS.
            const contentDiv = document.createElement('div');
            contentDiv.className = 'testimonial-content';

            // Name (safe: textContent + static SVG badge appended separately)
            const nameEl = document.createElement('h4');
            nameEl.className = 'testimonial-name';
            const safeUserName = (typeof r.userName === 'string' ? r.userName : 'Anónimo').trim() || 'Anónimo';
            nameEl.textContent = safeUserName.toUpperCase();
            nameEl.insertAdjacentHTML('beforeend', badgeSvg); // badge is static SVG, not user data

            // Date label (safe: derived from Date object, not user input)
            const roleEl = document.createElement('p');
            roleEl.className = 'testimonial-role';
            roleEl.textContent = dateStr;

            // Stars (safe: static SVG generated from integer rating)
            const starsDiv = document.createElement('div');
            starsDiv.style.marginBottom = '10px';
            starsDiv.setAttribute('aria-label', `${rating} de 5 estrelas`);
            starsDiv.innerHTML = starsHtml;

            // Review text [SEC-01 CRITICAL FIX]: textContent escapes HTML — no XSS possible
            const textEl = document.createElement('p');
            textEl.className = 'testimonial-text';
            const safeText = typeof r.text === 'string' ? r.text.slice(0, 1000) : '';
            textEl.textContent = safeText;

            contentDiv.appendChild(nameEl);
            contentDiv.appendChild(roleEl);
            contentDiv.appendChild(starsDiv);
            contentDiv.appendChild(textEl);
            div.appendChild(contentDiv);

            carousel.appendChild(div);
            
            if (dotsContainer) {
                const dot = document.createElement('div');
                dot.className = 'carousel-dot';
                dot.setAttribute('data-index', nextIndex);
                dotsContainer.appendChild(dot);
                
                dot.addEventListener('click', () => {
                    if (typeof window.showTestimonial === 'function') {
                        window.showTestimonial(parseInt(dot.getAttribute('data-index')));
                    }
                });
            }
            
            nextIndex++;
        });
        
    } catch(e) {
        console.error("Error loading dynamic reviews:", e);
    }
};
