import { db, auth } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const isEnglish = window.location.pathname.includes('/en/');
const langPrefix = isEnglish ? '_en' : '_pt';

let allPosts = [];
let currentFormat = 'all';
let currentCategory = 'all';
let currentSearch = '';

const CATEGORY_NAMES = {
    'osteopatia': isEnglish ? 'Osteopathy' : 'Osteopatia',
    'entrenamiento_personal': isEnglish ? 'Personal Training' : 'Treino Personalizado',
    'oncologia_ejercicio': isEnglish ? 'Oncology & Exercise' : 'Oncologia e Exercício',
    'nutricion': isEnglish ? 'Nutrition' : 'Nutrição',
    'casos_exito': isEnglish ? 'Success Cases' : 'Casos de Sucesso'
};

const FORMAT_ICONS = {
    'article': '📖',
    'video': '🎥',
    'pdf': '📄',
    'clinical_case': '👤'
};

const FORMAT_NAMES = {
    'article': isEnglish ? 'Article' : 'Artigo',
    'video': isEnglish ? 'Video' : 'Vídeo',
    'pdf': 'PDF',
    'clinical_case': isEnglish ? 'Clinical Case' : 'Caso Clínico'
};

export async function loadBlogPosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        container.innerHTML = `<div class="text-center w-100" style="padding: 100px 0; opacity: 0.5;">
            <i data-lucide="loader-2" class="spin" style="width: 40px; height: 40px;"></i>
            <p>${isEnglish ? 'Loading articles...' : 'A carregar artigos...'}</p>
        </div>`;
        if (window.lucide) window.lucide.createIcons();

        // Only fetch published posts
        const q = query(collection(db, "blog_posts"), where("published", "==", true), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allPosts = [];
        snapshot.forEach(docSnap => {
            allPosts.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Check for admin to show publish button
        const adminBtnContainer = document.getElementById('admin-publish-btn-container');
        if (adminBtnContainer) {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        const userData = userDoc.data();
                        if (userData?.role === 'admin' || user.email === 'pt.paulomorais@gmail.com' || user.email === 'admin@paulomorais.com') {
                            adminBtnContainer.style.display = 'block';
                            if (window.lucide) { window.lucide.createIcons(); }
                        }
                    } catch (err) {
                        console.error("Error checking admin role:", err);
                    }
                }
            });
        }
        
        setupFilters();
        renderPosts(containerId);
        
    } catch (error) {
        console.error("Error loading blog posts:", error);
        container.innerHTML = `<p class="text-center text-red" style="padding: 50px 0;">Erro: ${error.message}</p>`;
    }
}

function setupFilters() {
    const searchInput = document.getElementById('blog-search-input');
    const formatBtns = document.querySelectorAll('#format-filters .filter-btn');
    const categoryBtns = document.querySelectorAll('#category-filters .filter-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderPosts('public-blog-grid');
        });
    }

    formatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            formatBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFormat = e.currentTarget.dataset.filter;
            renderPosts('public-blog-grid');
        });
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = e.currentTarget.dataset.filter;
            renderPosts('public-blog-grid');
        });
    });
}



function renderPosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = allPosts.filter(post => {
        const title = (isEnglish ? post.title_en : post.title_pt) || post.title_pt || post.title_en || 'Sem Título';
        const summary = (isEnglish ? post.summary_en : post.summary_pt) || post.summary_pt || post.summary_en || '';
        const format = post.format || 'article';
        const category = post.category || '';

        const matchesSearch = title.toLowerCase().includes(currentSearch) || summary.toLowerCase().includes(currentSearch);
        const matchesFormat = currentFormat === 'all' || format === currentFormat;
        const matchesCategory = currentCategory === 'all' || category === currentCategory;

        return matchesSearch && matchesFormat && matchesCategory;
    });

    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center" style="opacity: 0.7; padding: 50px 0; grid-column: 1/-1;">${isEnglish ? 'No articles found matching your criteria.' : 'Nenhum artigo encontrado com estes critérios.'}</p>`;
        return;
    }

    filtered.forEach(post => {
        container.appendChild(createPostCard(post));
    });

    if (window.lucide) window.lucide.createIcons();
}

function createPostCard(data) {
    const title = (isEnglish ? data.title_en : data.title_pt) || data.title_pt || data.title_en || 'Sem Título';
    const summary = (isEnglish ? data.summary_en : data.summary_pt) || data.summary_pt || data.summary_en || '';
    const articleUrl = isEnglish ? `article.html?id=${data.slug || data.id}` : `artigo.html?id=${data.slug || data.id}`;
    const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString(isEnglish ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const readTime = data.readTime || 5;
    
    const format = data.format || 'article';
    const category = data.category;
    
    let badgesHtml = `<div class="post-badges">`;
    badgesHtml += `<span class="badge badge-format-${format}">${FORMAT_ICONS[format] || '📖'} ${FORMAT_NAMES[format] || FORMAT_NAMES['article']}</span>`;
    if (category && CATEGORY_NAMES[category]) {
        badgesHtml += `<span class="badge badge-category">${CATEGORY_NAMES[category]}</span>`;
    }
    badgesHtml += `</div>`;

    const card = document.createElement('div');
    card.className = 'blog-card';
    card.innerHTML = `
        <a href="${articleUrl}" class="blog-card-link">
            <div class="blog-card-content">
                <div style="margin-bottom: 20px;">
                    ${badgesHtml}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <p class="blog-date" style="margin-bottom: 0;">${dateStr}</p>
                    <p style="font-size: 0.8rem; color: var(--color-text-dim); display: flex; align-items: center; gap: 5px;"><i data-lucide="clock" style="width:12px; height:12px;"></i> ${readTime} min</p>
                </div>
                <h3 style="margin-top: 0;">${title}</h3>
                <p class="blog-summary">${summary}</p>
                <span class="blog-read-more">${isEnglish ? 'Read more' : 'Ler mais'} <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i></span>
            </div>
        </a>
    `;
    return card;
}

export async function loadSingleArticle(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('id');

    if (!slug) {
        container.innerHTML = `<p class="text-center text-red">${isEnglish ? 'Article not found.' : 'Artigo não encontrado.'}</p>`;
        return;
    }

    try {
        const docRef = doc(db, "blog_posts", slug);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data().published) {
            container.innerHTML = `<p class="text-center text-red" style="padding: 100px 0; font-size: 1.2rem;">${isEnglish ? 'Article not found or unpublished.' : 'Artigo não encontrado ou não publicado.'}</p>`;
            return;
        }

        const data = docSnap.data();
        const title = (isEnglish ? data.title_en : data.title_pt) || data.title_pt || data.title_en || 'Sem Título';
        const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString(isEnglish ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        const format = data.format || 'article';
        
        document.title = `${title} | Paulo Morais`;
        document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
        
        const summary = (isEnglish ? data.summary_en : data.summary_pt) || data.summary_pt || data.summary_en || '';
        document.querySelector('meta[name="description"]')?.setAttribute("content", summary);
        document.querySelector('meta[property="og:description"]')?.setAttribute("content", summary);

        let content = (isEnglish ? data.content_en : data.content_pt) || data.content_pt || data.content_en || '';
        let dynamicContentHtml = '';

        if (format === 'video' && data.videoUrl) {
            // Very simple embed conversion for YT/Vimeo
            let embedUrl = data.videoUrl;
            if (embedUrl.includes('youtube.com/watch?v=')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
            } else if (embedUrl.includes('youtu.be/')) {
                embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
            }
            dynamicContentHtml = `
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.1);">
                    <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                </div>
            `;
        } else if (format === 'pdf' && data.pdfUrl) {
            dynamicContentHtml = `
                <div style="margin-bottom: 40px;">
                    <div style="border-left: 4px solid var(--color-primary); padding-left: 20px; margin-bottom: 30px;">
                        <h3 style="color: var(--color-primary); margin-top: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">${isEnglish ? 'Abstract' : 'Resumo'}</h3>
                        <p style="font-size: 1.15rem; line-height: 1.6; color: var(--color-text-dim); font-style: italic; margin: 0;">"${summary}"</p>
                    </div>
                    <div class="text-left" style="margin-bottom: 10px;">
                        <a href="${data.pdfUrl}" target="_blank" style="background: var(--color-primary); color: #000; padding: 14px 28px; border-radius: 30px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 10px;">
                            <i data-lucide="download"></i> ${isEnglish ? 'Download Full Study' : 'Baixar Estudo Completo'}
                        </a>
                    </div>
                </div>
            `;
        } else if (format === 'clinical_case') {
            dynamicContentHtml = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;">
                    ${data.beforeImageUrl ? `
                        <div class="case-img-box">
                            <h4 style="text-align: center; color: var(--color-text-dim);">Antes</h4>
                            <img src="${data.beforeImageUrl}" style="width: 100%; border-radius: 12px; object-fit: cover;" alt="Antes">
                        </div>
                    ` : ''}
                    ${data.afterImageUrl ? `
                        <div class="case-img-box">
                            <h4 style="text-align: center; color: var(--color-primary);">Depois</h4>
                            <img src="${data.afterImageUrl}" style="width: 100%; border-radius: 12px; object-fit: cover;" alt="Depois">
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (format === 'article') {
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            let headings = tempDiv.querySelectorAll('h2, h3');
            
            let tocHtml = '';
            if (headings.length > 0) {
                tocHtml = '<div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 16px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.1);">';
                tocHtml += '<h3 style="margin-top: 0; margin-bottom: 15px; color: var(--color-primary); font-size: 1.2rem;"><i data-lucide="list"></i> Índice</h3><ul style="list-style: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;">';
                
                headings.forEach((heading, index) => {
                    const id = heading.id || `toc-heading-${index}`;
                    heading.id = id;
                    
                    const isSubHeading = heading.tagName.toLowerCase() === 'h3';
                    const padding = isSubHeading ? 'padding-left: 20px;' : '';
                    const opacity = isSubHeading ? 'opacity: 0.8;' : 'font-weight: 600;';
                    
                    tocHtml += `<li style="${padding}"><a href="#${id}" style="color: var(--color-text); text-decoration: none; transition: color 0.2s; ${opacity}" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text)'">${heading.innerText}</a></li>`;
                });
                tocHtml += '</ul></div>';
                
                content = tempDiv.innerHTML; // Update content with IDs
            }
            
            dynamicContentHtml = tocHtml;
        }

        container.innerHTML = `
            <div class="article-header" style="margin-bottom: 50px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                    <span style="background: rgba(230, 174, 23, 0.1); color: var(--color-primary); padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.5px;">${dateStr}</span>
                    <span style="color: var(--color-text-dim); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;"><i data-lucide="clock" style="width: 16px; height: 16px;"></i> ${data.readTime || 5} min read</span>
                </div>
                <h1 style="font-family: var(--font-heading); font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.15; font-weight: 800; color: var(--color-text); margin-bottom: 0;">${title}</h1>
            </div>
            
            ${dynamicContentHtml}
            
            <div class="article-body ql-editor" style="font-size: 1.15rem; line-height: 1.8; color: var(--color-text);">
                ${content}
            </div>
            
            <div class="article-footer" style="margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);">
                <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <div>
                        <h4 style="margin-top: 0; font-size: 1.1rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px;">${isEnglish ? 'Need personalized help?' : 'Precisas de ajuda personalizada?'}</h4>
                        <p style="color: var(--color-text-dim); margin-bottom: 0; font-size: 0.9rem;">${isEnglish ? 'Book a session and let us take care of your health.' : 'Agenda uma sessão e deixa-me cuidar da tua saúde.'}</p>
                    </div>
                    <a href="perfil.html?booking=true" style="background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); font-weight: 600; font-size: 0.85rem; padding: 8px 20px; border-radius: 30px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; margin-top: 10px;" onmouseover="this.style.background='var(--color-primary)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--color-primary)';"><i data-lucide="calendar" style="width:14px; height:14px;"></i> ${isEnglish ? 'Book Session' : 'Agendar Sessão'}</a>
                </div>
                <div style="margin-top: 30px; display: flex; justify-content: flex-start;">
                    <a href="blog.html" style="color: var(--color-text-dim); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: opacity 0.3s; font-size: 0.9rem; font-weight: 500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'"><i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> ${isEnglish ? 'Back to Blog' : 'Voltar ao Blog'}</a>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    } catch (error) {
        console.error("Error loading article:", error);
        container.innerHTML = `<p class="text-center text-red" style="padding: 100px 0;">${isEnglish ? 'Error loading article.' : 'Erro ao carregar artigo.'}</p>`;
    }
}
