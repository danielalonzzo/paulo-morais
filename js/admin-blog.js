import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
const blogGrid = document.getElementById('blog-grid');
const modal = document.getElementById('modal-post');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnNewPost = document.getElementById('btn-new-post');
const postForm = document.getElementById('post-form');

// Initialize Quill editors
let quillPT, quillEN;
let autoSaveInterval;
let lastSavedData = '';

function initEditors() {
    const toolbarOptions = [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ];
    
    quillPT = new Quill('#editor-pt', {
        theme: 'snow',
        modules: { toolbar: toolbarOptions },
        placeholder: 'Escreve aqui o conteúdo...'
    });
    
    quillEN = new Quill('#editor-en', {
        theme: 'snow',
        modules: { toolbar: toolbarOptions },
        placeholder: 'Write the content here...'
    });
}

// Check Auth & Admin
onAuthStateChanged(auth, async (user) => {
    try {
        if (!user) {
            window.location.href = 'perfil.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userData?.role !== 'admin' && user.email !== ADMIN_EMAIL) {
            alert("Acesso restrito a administradores.");
            window.location.href = 'perfil.html';
            return;
        }

        // Init editors and load posts
        initEditors();
        loadPosts();
        setupEventListeners();
    } catch (err) {
        console.error("Auth check error:", err);
        blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Erro: ${err.message}</p>`;
    }
});

async function loadPosts() {
    try {
        blogGrid.innerHTML = '<div class="text-center w-100" style="grid-column: 1/-1; padding: 50px 0;"><i data-lucide="loader-2" class="spin" style="width: 40px; height: 40px;"></i><p>A carregar artigos...</p></div>';
        if (window.lucide) window.lucide.createIcons();

        const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        blogGrid.innerHTML = "";
        
        if (querySnapshot.empty) {
            blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">Ainda não existem artigos. Cria o teu primeiro artigo!</p>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'post-card';
            
            const statusClass = data.published ? 'published' : 'draft';
            const statusText = data.published ? 'Publicado' : 'Rascunho';
            
            card.innerHTML = `
                <h3 style="margin-top: 10px;">${data.title_pt || data.title_en || 'Sem Título'}</h3>
                <p class="status ${statusClass}"><i data-lucide="${data.published ? 'check-circle' : 'edit-3'}" style="width:14px;height:14px;margin-bottom:-2px;"></i> ${statusText}</p>
                <div class="post-actions">
                    <button class="btn-edit" data-id="${docSnap.id}"><i data-lucide="edit-2"></i> Editar</button>
                    <button class="btn-delete" data-id="${docSnap.id}"><i data-lucide="trash-2"></i> Apagar</button>
                </div>
            `;
            blogGrid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();
        
        // Attach events to buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editPost(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deletePost(e.currentTarget.dataset.id));
        });

    } catch (error) {
        console.error("Error loading posts:", error);
        blogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Erro ao carregar artigos: ${error.message}</p>`;
    }
}

function handleFormatChange() {
    const format = document.getElementById('post-format').value;
    const dynamicFields = document.querySelectorAll('.format-fields');
    
    dynamicFields.forEach(el => el.style.display = 'none');
    
    if (format === 'video') {
        document.getElementById('dynamic-fields-video').style.display = 'block';
    } else if (format === 'pdf') {
        document.getElementById('dynamic-fields-pdf').style.display = 'block';
    } else if (format === 'clinical_case') {
        document.getElementById('dynamic-fields-case').style.display = 'block';
    }
}

function setupEventListeners() {
    document.getElementById('post-format').addEventListener('change', handleFormatChange);

    // Video Preview Logic
    const videoUrlInput = document.getElementById('post-video-url');
    const videoPreviewContainer = document.getElementById('video-preview-container');
    const videoPreviewIframe = document.getElementById('video-preview-iframe');

    videoUrlInput.addEventListener('input', () => {
        let url = videoUrlInput.value;
        if (!url) {
            videoPreviewContainer.style.display = 'none';
            return;
        }
        
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        }
        
        if (embedUrl !== url || embedUrl.includes('embed')) {
            videoPreviewIframe.src = embedUrl;
            videoPreviewContainer.style.display = 'block';
        } else {
            videoPreviewContainer.style.display = 'none';
        }
    });

    // Video Preview Logic

    // Modal behavior
    btnNewPost.addEventListener('click', () => {
        postForm.reset();
        document.getElementById('post-id').value = '';
        quillPT.root.innerHTML = '';
        quillEN.root.innerHTML = '';
        document.getElementById('modal-title').textContent = 'Novo Artigo';
        document.getElementById('auto-save-status').innerHTML = '<i data-lucide="cloud-off" style="width: 14px; height: 14px;"></i> Não guardado';
        handleFormatChange();
        videoPreviewContainer.style.display = 'none';
        lastSavedData = JSON.stringify(getFormData());
        modal.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    });

    btnCloseModal.addEventListener('click', () => {
        modal.classList.remove('active');
        clearInterval(autoSaveInterval);
    });

    // Auto-save logic
    autoSaveInterval = setInterval(async () => {
        if (modal.classList.contains('active')) {
            const id = document.getElementById('post-id').value;
            // Only auto-save if an ID exists (meaning it's not the very first keystroke of a new post without manual save)
            if (id || document.getElementById('title-pt').value.trim() !== '') {
                const currentData = JSON.stringify(getFormData());
                if (currentData !== lastSavedData) {
                    await autoSavePost();
                }
            }
        }
    }, 30000); // 30 seconds

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('btn-save-post');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> A Publicar...';
        if (window.lucide) window.lucide.createIcons();

        try {
            await savePost(true); // true means full save + close
        } catch (error) {
            console.error("Error saving post:", error);
            alert("Erro: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="upload-cloud"></i> Publicar Alterações';
            if (window.lucide) window.lucide.createIcons();
        }
    });
}

function getFormData() {
    return {
        format: document.getElementById('post-format').value || 'article',
        category: document.getElementById('post-category').value || 'osteopatia',
        title_pt: document.getElementById('title-pt').value.trim(),
        title_en: document.getElementById('title-en').value.trim(),
        summary_pt: document.getElementById('summary-pt').value.trim(),
        summary_en: document.getElementById('summary-en').value.trim(),
        content_pt: quillPT.root.innerHTML,
        content_en: quillEN.root.innerHTML,
        coverImageUrl: document.getElementById('post-cover').value,
        published: document.getElementById('post-published').checked,
        videoUrl: document.getElementById('post-video-url').value,
        pdfUrl: document.getElementById('post-pdf-url').value,
        beforeImageUrl: document.getElementById('post-before-img').value,
        afterImageUrl: document.getElementById('post-after-img').value,
    };
}

async function savePost(isManualSave = false) {
    const id = document.getElementById('post-id').value;
    const isNew = !id;
    
    const postData = getFormData();

    if (isManualSave) {
        const hasPT = postData.title_pt && postData.summary_pt;
        const hasEN = postData.title_en && postData.summary_en;
        
        if (!hasPT && !hasEN) {
            throw new Error("Tem de preencher o Título e Resumo em pelo menos um idioma (Português ou Inglês).");
        }
    }

    postData.updatedAt = serverTimestamp();

    let docRef;
    if (isNew) {
        postData.createdAt = serverTimestamp();
        postData.author = "Paulo Morais";
        postData.views = 0;
        docRef = doc(collection(db, "blog_posts")); // Generate auto ID
        document.getElementById('post-id').value = docRef.id;
    } else {
        docRef = doc(db, "blog_posts", id);
    }

    await setDoc(docRef, postData, { merge: true });
    lastSavedData = JSON.stringify(postData);

    const statusEl = document.getElementById('auto-save-status');
    const now = new Date();
    statusEl.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px; color: green;"></i> Guardado às ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (window.lucide) window.lucide.createIcons();

    if (isManualSave) {
        modal.classList.remove('active');
        loadPosts();
    }
}

async function autoSavePost() {
    try {
        const statusEl = document.getElementById('auto-save-status');
        statusEl.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> A guardar...`;
        if (window.lucide) window.lucide.createIcons();
        
        await savePost(false); // background save
    } catch (e) {
        console.warn("Auto-save failed:", e);
    }
}

async function editPost(id) {
    try {
        const docSnap = await getDoc(doc(db, "blog_posts", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            document.getElementById('post-id').value = id;
            document.getElementById('post-cover').value = data.coverImageUrl || '';
            document.getElementById('title-pt').value = data.title_pt || '';
            document.getElementById('title-en').value = data.title_en || '';
            document.getElementById('summary-pt').value = data.summary_pt || '';
            document.getElementById('summary-en').value = data.summary_en || '';
            document.getElementById('post-published').checked = data.published || false;
            
            // New fields
            document.getElementById('post-format').value = data.format || 'article';
            document.getElementById('post-category').value = data.category || 'osteopatia';
            document.getElementById('post-video-url').value = data.videoUrl || '';
            document.getElementById('post-pdf-url').value = data.pdfUrl || '';
            document.getElementById('post-before-img').value = data.beforeImageUrl || '';
            document.getElementById('post-after-img').value = data.afterImageUrl || '';

            handleFormatChange();
            
            // Trigger video preview if exists
            if (data.videoUrl) {
                document.getElementById('post-video-url').dispatchEvent(new Event('input'));
            }

            quillPT.root.innerHTML = data.content_pt || '';
            quillEN.root.innerHTML = data.content_en || '';
            
            document.getElementById('modal-title').textContent = 'Editar Publicação';
            document.getElementById('auto-save-status').innerHTML = `<i data-lucide="cloud" style="width: 14px; height: 14px;"></i> Em rascunho`;
            
            lastSavedData = JSON.stringify(getFormData());
            modal.classList.add('active');
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        alert("Erro ao abrir artigo para edição.");
    }
}

async function deletePost(id) {
    if (confirm("Tens a certeza absoluta que queres apagar este artigo? Esta ação é irreversível.")) {
        try {
            await deleteDoc(doc(db, "blog_posts", id));
            loadPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Erro ao apagar artigo.");
        }
    }
}
