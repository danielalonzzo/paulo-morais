import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    writeBatch,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
let currentWeekStart = new Date(); // We will align this to Monday
// Logic to align to current week's Monday
const day = currentWeekStart.getDay() || 7;  // 1-7, Mon-Sun
if (day !== 1) currentWeekStart.setHours(-24 * (day - 1));
currentWeekStart.setHours(0, 0, 0, 0);

let selectedClientSlots = []; // Global array to track multiple selections

export function initCalendarMode(user, db, role = null) {
    const calendarSection = document.getElementById('calendar-section');
    const adminSection = document.getElementById('admin-calendar-section');

    // Update Week Headers
    const weekHeaders = document.querySelectorAll('.current-week');
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const formatter = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });
    const weekText = `${formatter.format(currentWeekStart)} - ${formatter.format(endDate)}`;
    weekHeaders.forEach(el => el.textContent = weekText);

    if (!calendarSection || !adminSection) return;

    // Determine if user is admin
    const isAdmin = role === 'admin' || user.email === ADMIN_EMAIL;

    if (isAdmin) {
        adminSection.classList.remove('hidden');
        calendarSection.classList.add('hidden');
        renderAdminGrid(db, user);
    } else {
        calendarSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        renderClientGrid(db, user);
    }
}

// Deterministic User Color Generator
function getUserColor(uid) {
    if (!uid) return "#333";
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    // High saturation and varied hue
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 40%)`;
}

function getWeekId(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderClientGrid(db, user) {
    const gridEl = document.getElementById('client-weekly-grid');
    if (!gridEl) return;

    const weekId = getWeekId(currentWeekStart);
    const docRef = doc(db, "weekly_schedules", weekId);

    onSnapshot(docRef, (docSnap) => {
        let scheduleData = null;
        if (docSnap.exists()) {
            scheduleData = docSnap.data();
        }
        buildGrid(gridEl, scheduleData, false, db, user, weekId);
    });
}

function renderAdminGrid(db, user) {
    const gridEl = document.getElementById('admin-weekly-grid');
    const legendEl = document.getElementById('admin-user-legend');
    if (!gridEl) return;

    const weekId = getWeekId(currentWeekStart);
    const docRef = doc(db, "weekly_schedules", weekId);

    onSnapshot(docRef, async (docSnap) => {
        let scheduleData = { slots: {} };
        if (docSnap.exists()) {
            scheduleData = docSnap.data();
        }
        
        const userNames = {};
        if (scheduleData && scheduleData.slots) {
            const uids = [...new Set(Object.values(scheduleData.slots)
                .filter(s => s.status === 'booked' && s.bookedBy)
                .map(s => s.bookedBy))];
            
            // Parallel fetch
            await Promise.all(uids.map(async (uid) => {
                try {
                    const uDoc = await getDoc(doc(db, "users", uid));
                    if (uDoc.exists() && uDoc.data().name) {
                        userNames[uid] = uDoc.data().name;
                    }
                } catch (e) { 
                    console.warn(`Could not fetch name for user ${uid}`, e); 
                }
            }));
        }

        buildGrid(gridEl, scheduleData, true, db, user, weekId, userNames);
        renderAdminUserLegend(scheduleData, legendEl, userNames);
    });
}

// Helper to clean up display names (removes @... if it's an email)
function formatDisplayName(name) {
    if (!name) return "Utilizador";
    if (name.includes('@')) {
        return name.split('@')[0].split('.')[0].replace(/[0-9]/g, ''); // Simplistic cleaner
    }
    return name;
}

function renderAdminUserLegend(data, legendEl, userNames = {}) {
    if (!legendEl || !data || !data.slots) return;
    legendEl.innerHTML = "";
    legendEl.classList.remove('hidden');
    
    const bookedUsers = {};
    Object.values(data.slots).forEach(slot => {
        if (slot.status === 'booked' && slot.bookedBy) {
            const resolvedName = userNames[slot.bookedBy] || slot.bookedName;
            bookedUsers[slot.bookedBy] = formatDisplayName(resolvedName);
        }
    });

    if (Object.keys(bookedUsers).length === 0) {
        legendEl.classList.add('hidden');
        return;
    }

    Object.entries(bookedUsers).forEach(([uid, name]) => {
        const item = document.createElement('div');
        item.className = 'user-legend-item';
        item.innerHTML = `
            <div class="user-color-dot" style="background: ${getUserColor(uid)}"></div>
            <span>${name}</span>
        `;
        legendEl.appendChild(item);
    });
}

function buildGrid(wrapper, data, isAdmin, db, user, weekId, userNames = {}) {
    wrapper.innerHTML = "";
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const startHour = 7;
    const endHour = 20;

    for (let i = 0; i < 7; i++) {
        let dayDate = new Date(currentWeekStart);
        dayDate.setDate(currentWeekStart.getDate() + i);
        let dateNum = String(dayDate.getDate()).padStart(2, '0');
        let fullDateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${dateNum}`;

        let col = document.createElement('div');
        col.className = `day-column ${i >= 5 ? 'weekend' : ''}`;

        let header = document.createElement('div');
        header.className = 'day-header';
        header.innerHTML = `${days[i]}<br><span class="day-date">${dateNum}</span>`;
        col.appendChild(header);

        let slotsContainer = document.createElement('div');
        slotsContainer.className = 'time-slots';

        for (let h = startHour; h <= endHour; h++) {
            let hourStr = String(h).padStart(2, '0') + ':00';
            let slotId = `${fullDateStr}T${hourStr}`;

            let btn = document.createElement('button');
            btn.textContent = hourStr;
            btn.dataset.slotId = slotId;

            if (isAdmin) {
                if (data && data.slots && data.slots[slotId] && data.slots[slotId].status === 'booked') {
                    const slotInfo = data.slots[slotId];
                    const sType = slotInfo.serviceType || 'treino';
                    btn.className = `time-slot admin-booked service-${sType}`;
                    btn.style.backgroundColor = getUserColor(slotInfo.bookedBy);
                    btn.style.color = "#fff";
                    
                    const rawName = userNames[slotInfo.bookedBy] || slotInfo.bookedName;
                    const displayName = formatDisplayName(rawName);
                    
                    btn.innerHTML = `${hourStr}<br><span class="client-name">${displayName}</span>`;
                    btn.disabled = true;
                } else {
                    btn.className = 'time-slot admin-selectable';
                    if (data && data.slots && data.slots[slotId]) {
                        const sType = data.slots[slotId].serviceType || 'treino';
                        btn.classList.add('active', `service-${sType}`);
                        btn.dataset.serviceType = sType;
                    }
                    btn.onclick = () => {
                        if (!btn.classList.contains('active')) {
                            btn.classList.add('active', 'service-treino');
                            btn.dataset.serviceType = 'treino';
                        } else if (btn.classList.contains('service-treino')) {
                            btn.classList.remove('service-treino');
                            btn.classList.add('service-osteo');
                            btn.dataset.serviceType = 'osteopatia';
                        } else {
                            btn.classList.remove('active', 'service-osteo');
                            delete btn.dataset.serviceType;
                        }
                    }
                }
            } else {
                if (data && data.slots && data.slots[slotId]) {
                    const slotInfo = data.slots[slotId];
                    const sType = slotInfo.serviceType || 'treino';
                    const serviceClass = `service-${sType === 'osteopatia' ? 'osteo' : 'treino'}`;

                    if (slotInfo.status === 'booked') {
                        if (slotInfo.bookedBy === user.uid) {
                            btn.className = `time-slot selected ${serviceClass}`;
                        } else {
                            btn.className = 'time-slot booked';
                            btn.disabled = true;
                        }
                    } else {
                        btn.className = `time-slot available ${serviceClass}`;
                        // Multi-select persistence
                        if (selectedClientSlots.some(s => s.id === slotId)) {
                            btn.classList.add('active-selection');
                        }
                        btn.onclick = () => toggleClientSlot(slotId, hourStr, sType, btn, db, user, weekId);
                    }
                } else {
                    btn.className = 'time-slot empty';
                    btn.disabled = true;
                }
            }
            slotsContainer.appendChild(btn);
        }
        col.appendChild(slotsContainer);
        wrapper.appendChild(col);
    }

    if (isAdmin) setupAdminPublishButton(db, weekId, wrapper);
}

function setupAdminPublishButton(db, weekId, gridWrapper) {
    const pubBtn = document.getElementById('btn-publish-week');
    if (!pubBtn) return;

    const newBtn = pubBtn.cloneNode(true);
    pubBtn.parentNode.replaceChild(newBtn, pubBtn);

    newBtn.addEventListener('click', async () => {
        newBtn.disabled = true;
        newBtn.textContent = 'A publicar...';

        const slotsMap = {};
        const activeButtons = gridWrapper.querySelectorAll('.time-slot.active');
        activeButtons.forEach(b => {
            const slotId = b.dataset.slotId;
            slotsMap[slotId] = {
                status: 'available',
                bookedBy: null,
                bookedName: null,
                serviceType: b.dataset.serviceType || 'treino'
            };
        });

        const docRef = doc(db, "weekly_schedules", weekId);
        try {
            const existingSnap = await getDoc(docRef);
            if (existingSnap.exists()) {
                const existingData = existingSnap.data();
                Object.keys(existingData.slots || {}).forEach(k => {
                    if (existingData.slots[k].status === 'booked') {
                        slotsMap[k] = existingData.slots[k];
                    }
                });
            }
            await setDoc(docRef, {
                publishedDate: new Date().toISOString(),
                publishedByAdmin: true,
                slots: slotsMap
            }, { merge: true });
            alert("Semana publicada com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro ao publicar");
        }
        newBtn.disabled = false;
        newBtn.innerHTML = '<i data-lucide="send" style="width: 18px; height: 18px; margin-right: 8px;"></i> Publicar Semana';
        if (window.lucide) window.lucide.createIcons();
    });
}

function toggleClientSlot(slotId, time, serviceType, btn, db, user, weekId) {
    const index = selectedClientSlots.findIndex(s => s.id === slotId);
    if (index > -1) {
        selectedClientSlots.splice(index, 1);
        btn.classList.remove('active-selection');
    } else {
        selectedClientSlots.push({ id: slotId, time, serviceType });
        btn.classList.add('active-selection');
    }
    updateBookingSummary(db, user, weekId);
}

function updateBookingSummary(db, user, weekId) {
    const summaryContainer = document.getElementById('booking-summary-container');
    const summaryList = document.getElementById('booking-summary-list');
    const confirmBtn = document.getElementById('btn-confirm-booking');

    if (!summaryContainer || !summaryList || !confirmBtn) return;

    if (selectedClientSlots.length === 0) {
        summaryContainer.classList.add('hidden');
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Confirmar Reserva";
        return;
    }

    summaryContainer.classList.remove('hidden');
    confirmBtn.disabled = false;
    summaryList.innerHTML = "";

    selectedClientSlots.forEach(slot => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        const sName = slot.serviceType === 'osteopatia' ? 'Osteopatia' : 'Treino';
        item.innerHTML = `
            <span><strong>${sName}</strong> - ${slot.time} (${slot.id.split('T')[0]})</span>
            <button class="remove-slot" data-slot-id="${slot.id}">&times;</button>
        `;
        summaryList.appendChild(item);
    });

    confirmBtn.textContent = `Confirmar ${selectedClientSlots.length} Reservas`;
    
    summaryList.onclick = (e) => {
        const removeBtn = e.target.closest('.remove-slot');
        if (removeBtn) {
            const slotId = removeBtn.dataset.slotId;
            const btnInGrid = document.querySelector(`button[data-slot-id="${slotId}"]`);
            if (btnInGrid) btnInGrid.click();
        }
    };

    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "A processar...";
        
        try {
            // Fetch the actual user name from Firestore first
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let userName = user.email || user.displayName || "Utilizador";
            if (userDoc.exists()) {
                userName = userDoc.data().name || userName;
            }

            const batch = writeBatch(db);
            const scheduleRef = doc(db, "weekly_schedules", weekId);
            const userRef = doc(db, "users", user.uid);
            
            const bookingsToSave = [];

            selectedClientSlots.forEach(slot => {
                const bookingData = {
                    status: 'booked',
                    bookedBy: user.uid,
                    bookedName: userName,
                    serviceType: slot.serviceType,
                    timestamp: new Date().toISOString(),
                    time: slot.time,
                    date: slot.id.split('T')[0]
                };
                
                batch.set(scheduleRef, {
                    slots: { [slot.id]: bookingData }
                }, { merge: true });
                
                bookingsToSave.push(bookingData);
            });

            // Update user's personal booking history
            batch.set(userRef, {
                bookingsHistory: arrayUnion(...bookingsToSave)
            }, { merge: true });

            await batch.commit();
            
            alert(`Reserva de ${selectedClientSlots.length} horários confirmada com sucesso!`);
            selectedClientSlots = [];
            summaryContainer.classList.add('hidden');
            renderClientGrid(db, user);
        } catch (e) {
            console.error(e);
            alert("Erro ao confirmar as reservas.");
            confirmBtn.disabled = false;
        }
    };
}

