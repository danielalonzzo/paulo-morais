import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
const profilesGrid = document.getElementById('profiles-grid');
const modal = document.getElementById('modal-details');
const modalName = document.getElementById('modal-name');
const modalContainer = document.getElementById('modal-data-container');
const btnCloseModal = document.getElementById('btn-close-modal');

// Check Auth & Admin
onAuthStateChanged(auth, async (user) => {
    try {
        if (!user) {
            console.log("No user found, redirecting...");
            window.location.href = 'perfil.html';
            return;
        }

        console.log("User authenticated:", user.email);

        // Verify Admin Role in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        console.log("User data from Firestore:", userData);

        if (userData?.role !== 'admin' && user.email !== ADMIN_EMAIL) {
            alert("Access restricted to administrators.");
            window.location.href = 'perfil.html';
            return;
        }

        // If Admin, load profiles
        loadProfiles();
    } catch (err) {
        console.error("Auth/Admin check error:", err);
        profilesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Authentication/permission error: ${err.message}</p>`;
    }
});

async function loadProfiles() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        profilesGrid.innerHTML = "";
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });

        // Filter out admins and Paulo himself
        const clients = users.filter(u => u.role !== 'admin' && u.email !== ADMIN_EMAIL).sort((a,b) => (a.name || "").localeCompare(b.name || ""));

        if (clients.length === 0) {
            profilesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No students registered.</p>`;
            return;
        }

        clients.forEach(userData => {
            const isDeact = userData.isDeactivated ? '<span style="display:inline-block; margin-top:8px; font-size:0.7rem; background:var(--color-danger, #ef4444); color:#fff; padding:3px 8px; border-radius:4px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Account Deactivated</span>' : '';
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div>
                    <h4>${userData.name || "No Name"}</h4>
                    <p>${userData.email}</p>
                    ${isDeact}
                </div>
                <div class="card-footer-link">
                    VIEW FULL PROFILE <i data-lucide="external-link" style="width: 14px;"></i>
                </div>
            `;

            card.onclick = () => showUserDetails(userData);
            profilesGrid.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error("Error loading profiles:", error);
        let errorMsg = error.message;
        if (error.code === 'permission-denied') {
            errorMsg = "Permission denied. Verify if your account has administrator privileges in Firestore.";
        }
        profilesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center;">
                <p style="color: #ff6b6b; font-weight: 600;">An error occurred while loading data.</p>
                <p style="opacity: 0.7; font-size: 0.9rem;">${errorMsg}</p>
            </div>
        `;
    }
}

async function showUserDetails(data) {
    modalName.innerHTML = (data.name || "No Name") + (data.isDeactivated ? ' <span style="font-size:0.8rem; background:var(--color-danger, #ef4444); color:#fff; padding:3px 8px; border-radius:4px; vertical-align:middle; margin-left:10px;">ACCOUNT DEACTIVATED BY USER</span>' : '');
    modalContainer.innerHTML = "";

    const details = [
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone || "---" },
        { label: "Date of Birth", value: data.birthdate || "---" },
        { label: "Age", value: data.age ? `${data.age} years` : "---" },
        { label: "Weight", value: data.weight ? `${data.weight} kg` : "---" },
        { label: "Height", value: data.height ? `${data.height} cm` : "---" },
        { label: "Fat Mass", value: data.fatMass ? `${data.fatMass} %` : "---" },
        { label: "Muscle Mass", value: data.muscleMass ? `${data.muscleMass} kg` : "---" },
        { label: "Health Issues", value: data.healthIssues || "---" },
        { label: "Physical Limitations", value: data.physicalLimits || "---" }
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

    if (data.observations) {
        const obsBox = document.createElement('div');
        obsBox.className = 'observations-box';
        obsBox.innerHTML = `
            <span class="observations-title">Observations</span>
            <p style="margin: 0; line-height: 1.6; opacity: 0.8;">${data.observations}</p>
        `;
        modalContainer.appendChild(obsBox);
    }

    // Booking History Section — read from weekly_schedules/user_{uid}
    try {
        const bookingDoc = await getDoc(doc(db, "weekly_schedules", `user_${data.id}`));
        if (bookingDoc.exists()) {
            const bookings = bookingDoc.data().bookings || [];
            if (bookings.length > 0) {
                const historyBox = document.createElement('div');
                historyBox.className = 'history-box';
                
                // Sort history by date/time (most recent first)
                const sortedHistory = [...bookings].sort((a, b) => {
                    const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`) : new Date(0);
                    const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`) : new Date(0);
                    return dateB - dateA;
                });

                historyBox.innerHTML = `
                    <span class="history-title">Booking History <i data-lucide="history" style="width:16px;"></i></span>
                    <div class="history-list">
                        ${sortedHistory.map(item => `
                            <div class="history-item">
                                <div class="history-main-info">
                                    <span class="history-tag ${item.serviceType === 'osteopatia' ? 'tag-osteo' : 'tag-treino'}">
                                        ${item.serviceType === 'osteopatia' ? 'Osteopathy' : 'Training'}
                                    </span>
                                </div>
                                
                                <div class="history-schedule-meta">
                                    <div class="meta-item">
                                        <i data-lucide="calendar"></i>
                                        <span>${item.date || '---'}</span>
                                    </div>
                                    <div class="meta-item">
                                        <i data-lucide="clock"></i>
                                        <span>${item.time || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                modalContainer.appendChild(historyBox);
            }
        }
    } catch (e) {
        console.warn("Could not load booking history for user", e);
    }

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
