/*
 * Developed by Elysium λ Development & Research
 * A European company
 */
import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    getDoc,
    getDocs,
    collection
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const historyContent = document.getElementById('history-content');
const pageTitle = document.getElementById('page-title');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "perfil.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin' || user.email === "pt@pmorais.pt";
        
        pageTitle.textContent = isAdmin ? "Global Booking History" : "Your History";
        
        let consolidatedHistory = [];
        
        if (isAdmin) {
            // Read all user booking documents from weekly_schedules collection
            const allDocs = await getDocs(collection(db, "weekly_schedules"));
            allDocs.forEach(docSnap => {
                const data = docSnap.data();
                // User booking docs have IDs starting with "user_"
                if (docSnap.id.startsWith('user_') && data.bookings && data.bookings.length > 0) {
                    const userName = data.name || data.email || "User";
                    data.bookings.forEach(booking => {
                        consolidatedHistory.push({
                            ...booking,
                            userName: booking.bookedName || userName
                        });
                    });
                }
            });
        } else {
            // Read user's own booking doc from weekly_schedules
            const bookingDoc = await getDoc(doc(db, "weekly_schedules", `user_${user.uid}`));
            if (bookingDoc.exists()) {
                consolidatedHistory = bookingDoc.data().bookings || [];
            }
        }

        if (consolidatedHistory.length > 0) {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            
            // Filter: Admin sees everything before today
            const historyToDisplay = consolidatedHistory.filter(item => {
                if (isAdmin) return item.date < todayStr;
                return true;
            });

            // Sort most recent first
            historyToDisplay.sort((a, b) => {
                const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`) : new Date(0);
                const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`) : new Date(0);
                return dateB - dateA;
            });

            if (historyToDisplay.length > 0) {
                historyContent.innerHTML = historyToDisplay.map(item => `
                    <div class="history-item">
                        <div class="history-main-info">
                            <span class="history-tag ${item.serviceType === 'osteopatia' ? 'tag-osteo' : 'tag-treino'}">
                                ${item.serviceType === 'osteopatia' ? 'Osteopathy' : 'Training'}
                            </span>
                            ${isAdmin ? `
                                <div class="history-user-info">
                                    <span class="user-name">${item.userName}</span>
                                </div>
                            ` : ''}
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
                `).join('');
            } else {
                historyContent.innerHTML = `
                    <div class="empty-history" style="text-align: center; padding: 100px; opacity: 0.5;">
                        <i data-lucide="calendar"></i>
                        <p>No records of past bookings yet.</p>
                    </div>
                `;
            }
        } else {
            historyContent.innerHTML = `
                <div class="empty-history" style="text-align: center; padding: 100px; opacity: 0.5;">
                    <i data-lucide="calendar-off"></i>
                    <p>The history is empty.</p>
                </div>
            `;
        }

        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error("Error loading history page:", error);
        if (historyContent) {
            historyContent.innerHTML = `<p style="color:red; text-align:center;">Error loading data.</p>`;
        }
    }
});
