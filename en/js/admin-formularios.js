import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
const formsGrid = document.getElementById('forms-grid');
const modal = document.getElementById('modal-details');
const modalName = document.getElementById('modal-name');
const modalContainer = document.getElementById('modal-data-container');
const btnCloseModal = document.getElementById('btn-close-modal');

// Check Auth & Admin
onAuthStateChanged(auth, async (user) => {
    try {
        if (!user) {
            window.location.href = 'perfil.html';
            return;
        }

        // Verify Admin Role in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userData?.role !== 'admin' && user.email !== ADMIN_EMAIL) {
            alert("Access restricted to administrators.");
            window.location.href = 'perfil.html';
            return;
        }

        // If Admin, load contact forms
        loadContactForms();
    } catch (err) {
        console.error("Auth/Admin check error:", err);
        if (formsGrid) formsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Authentication/permission error: ${err.message}</p>`;
    }
});

async function loadContactForms() {
    try {
        const q = query(collection(db, "contactos"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (formsGrid) formsGrid.innerHTML = "";
        
        if (querySnapshot.empty) {
            if (formsGrid) formsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No contact forms received.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const formData = doc.data();
            const date = formData.timestamp?.toDate ? formData.timestamp.toDate().toLocaleString('en-GB') : "Unknown date";
            
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div>
                    <h4 style="font-size: 1.1rem;">${formData.nome} ${formData.apelido}</h4>
                    <p style="margin-bottom: 10px;">${formData.email}</p>
                    <p style="font-size: 0.8rem; opacity: 0.4;">${date}</p>
                </div>
                <div class="card-footer-link">
                    VIEW MESSAGE <i data-lucide="mail-open" style="width: 14px;"></i>
                </div>
            `;

            card.onclick = () => showFormDetails(formData, date);
            if (formsGrid) formsGrid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error("Error loading forms:", error);
        if (formsGrid) formsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <p style="color: #ff6b6b; font-weight: 600;">An error occurred while loading the forms.</p>
                <p style="opacity: 0.7; font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
    }
}

function showFormDetails(data, dateStr) {
    if (!modalName || !modalContainer || !modal) return;

    modalName.textContent = `${data.nome} ${data.apelido}`;
    modalContainer.innerHTML = "";

    const details = [
        { label: "Email", value: data.email },
        { label: "Date Sent", value: dateStr },
        { label: "Source", value: data.page || "Unknown" }
    ];

    details.forEach(item => {
        const div = document.createElement('div');
        div.className = 'detail-group';
        div.innerHTML = `
            <span class="detail-label">${item.label}</span>
            <span class="detail-value">${item.value}</span>
        `;
        modalContainer.appendChild(div);
    });

    const msgBox = document.createElement('div');
    msgBox.className = 'message-box';
    msgBox.innerHTML = `
        <span class="message-title">Message</span>
        <p style="margin: 0; line-height: 1.6; opacity: 0.9; white-space: pre-wrap;">${data.descricao || "No content."}</p>
    `;
    modalContainer.appendChild(msgBox);

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
}

// Modal closing
if (btnCloseModal) {
    btnCloseModal.onclick = () => modal.classList.remove('active');
}

window.onclick = (event) => {
    if (event.target == modal) {
        modal.classList.remove('active');
    }
}
