import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    writeBatch,
    updateDoc,
    deleteField
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
let currentWeekStart = new Date(); // We will align this to Sunday
// Logic to align to current week's Sunday
const day = currentWeekStart.getDay(); 
if (day !== 0) {
    currentWeekStart.setDate(currentWeekStart.getDate() - day);
}
currentWeekStart.setHours(0, 0, 0, 0);

let selectedClientSlots = []; // Global array to track multiple selections

export function initCalendarMode(user, db, role = null, profileCompleted = false) {
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
    console.log("initCalendarMode - isAdmin:", isAdmin, "profileCompleted:", profileCompleted);

    // Initial load logic is handled by auth.js loadDashboardPreview
    // We just render the grid in background if we want, or leave it to openGlobalAgenda
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
            // Collect UIDs from both personal bookings and group bookings
            const uidSet = new Set();
            Object.values(scheduleData.slots).forEach(s => {
                if (s.status === 'booked' && s.bookedBy) {
                    uidSet.add(s.bookedBy);
                }
                // Group bookings
                if (s.bookedUsers && Array.isArray(s.bookedUsers)) {
                    s.bookedUsers.forEach(bu => uidSet.add(bu.uid));
                }
            });
            const uids = [...uidSet];
            
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

        buildGrid(gridEl, scheduleData, true, db, user, weekId, userNames, true);
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
        // Group bookings
        if (slot.bookedUsers && Array.isArray(slot.bookedUsers)) {
            slot.bookedUsers.forEach(bu => {
                const resolvedName = userNames[bu.uid] || bu.name;
                bookedUsers[bu.uid] = formatDisplayName(resolvedName);
            });
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

function buildGrid(wrapper, data, isAdmin, db, user, weekId, userNames = {}, isReadOnly = false) {
    wrapper.innerHTML = "";
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const startHour = 6;
    const endHour = 20;

    for (let i = 0; i < 7; i++) {
        let dayDate = new Date(currentWeekStart);
        dayDate.setDate(currentWeekStart.getDate() + i);
        let dateNum = String(dayDate.getDate()).padStart(2, '0');
        let fullDateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${dateNum}`;

        let col = document.createElement('div');
        col.className = `day-column ${(i === 0 || i === 6) ? 'weekend' : ''}`;

        let header = document.createElement('div');
        header.className = 'day-header';
        header.innerHTML = `${days[i]}<br><span class="day-date">${dateNum}</span>`;
        col.appendChild(header);

        let slotsContainer = document.createElement('div');
        slotsContainer.className = 'time-slots';

        for (let h = startHour; h <= endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === endHour && m > 0) break;
                let hourStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                let slotId = `${fullDateStr}T${hourStr}`;

            let btn = document.createElement('div'); // Using div instead of button for better nested interaction
            btn.className = 'time-slot';
            btn.textContent = hourStr;
            btn.dataset.slotId = slotId;

            if (isAdmin) {
                if (data && data.slots && data.slots[slotId]) {
                    const slotInfo = data.slots[slotId];
                    
                    // Check for group bookings (grupal with bookedUsers)
                    if (slotInfo.serviceType === 'grupal' && slotInfo.bookedUsers && slotInfo.bookedUsers.length > 0) {
                        // Group booked slot — show count and make clickable
                        const count = slotInfo.bookedUsers.length;
                        btn.className = 'time-slot admin-booked-group';
                        btn.innerHTML = `${hourStr}<br><span class="group-count">${count} reserva${count !== 1 ? 's' : ''}</span>`;
                        
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            openGroupPopup(slotId, slotInfo, db, weekId, userNames, isReadOnly);
                        };
                    } else if (slotInfo.status === 'booked' && slotInfo.bookedBy) {
                        // Personal booking (treino/osteopatia)
                        const sType = slotInfo.serviceType || 'treino';
                        btn.className = `time-slot admin-booked service-${sType}`;
                        btn.style.backgroundColor = getUserColor(slotInfo.bookedBy);
                        btn.style.color = "#fff";
                        
                        const rawName = userNames[slotInfo.bookedBy] || slotInfo.bookedName;
                        const displayName = formatDisplayName(rawName);
                        
                        btn.innerHTML = `${hourStr}<br><span class="client-name">${displayName}</span>`;
                        
                        if (!isReadOnly) {
                            // Add X button for Admin cancellation
                            const cancelBtn = document.createElement('button');
                            cancelBtn.className = 'cancel-booking-btn';
                            cancelBtn.innerHTML = '<i data-lucide="x"></i>';
                            cancelBtn.title = "Eliminar Reserva";
                            cancelBtn.onclick = (e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja eliminar a reserva de "${displayName}"?`)) {
                                    cancelAdminBooking(db, weekId, slotId, slotInfo);
                                }
                            };
                            btn.appendChild(cancelBtn);
                            btn.style.pointerEvents = 'auto';
                        } else {
                            btn.style.pointerEvents = 'none';
                        }
                        btn.onclick = (e) => e.stopPropagation();
                    } else {
                        // Available slot — admin selectable
                        if (isReadOnly) {
                            btn.className = 'time-slot available-readonly';
                            btn.style.opacity = '0.3';
                            btn.style.pointerEvents = 'none';
                        } else {
                            btn.className = 'time-slot admin-selectable';
                            const sType = slotInfo.serviceType || 'treino';
                            if (slotInfo.status === 'available' || slotInfo.serviceType) {
                                btn.classList.add('active', `service-${sType}`);
                                btn.dataset.serviceType = sType;
                                
                                // If grupal slot with no bookings yet, show "0 reservas"
                                if (sType === 'grupal') {
                                    const count = (slotInfo.bookedUsers && slotInfo.bookedUsers.length) || 0;
                                    btn.innerHTML = `${hourStr}<br><span class="group-count">${count} reservas</span>`;
                                }
                            }
                            btn.onclick = () => adminCycleSlot(btn, hourStr);
                        }
                    }
                } else {
                    // Empty slot — admin selectable
                    btn.className = 'time-slot admin-selectable';
                    btn.onclick = () => adminCycleSlot(btn, hourStr);
                }
            } else {
                // CLIENT VIEW
                if (data && data.slots && data.slots[slotId] && data.slots[slotId].status !== 'blocked') {
                    const slotInfo = data.slots[slotId];
                    const sType = slotInfo.serviceType || 'treino';
                    
                    if (sType === 'grupal') {
                        // GROUP TRAINING — Client view
                        const bookedUsers = slotInfo.bookedUsers || [];
                        const userAlreadyBooked = bookedUsers.some(bu => bu.uid === user.uid);
                        const count = bookedUsers.length;
                        
                        if (userAlreadyBooked) {
                            // User already reserved this group slot
                            btn.className = 'time-slot selected service-grupal';
                            btn.innerHTML = `${hourStr}<br><span class="group-count">${count} reserva${count !== 1 ? 's' : ''}</span>`;
                            
                            if (selectedClientSlots.some(s => s.id === slotId && s.action === 'cancel')) {
                                btn.classList.add('active-selection', 'cancelling');
                                btn.innerHTML = `${hourStr}<br><span style="font-size: 0.7rem; font-weight: 900; opacity: 1; display: block; margin-top: 2px;">CANCELAR</span>`;
                            }
                            btn.onclick = () => toggleClientSlot(slotId, hourStr, sType, btn, db, user, weekId, 'cancel', slotInfo);
                        } else {
                            // Available group slot — user can join
                            btn.className = 'time-slot available service-grupal';
                            btn.innerHTML = `${hourStr}<br><span class="group-count">${count} reserva${count !== 1 ? 's' : ''}</span>`;
                            
                            if (selectedClientSlots.some(s => s.id === slotId && s.action === 'book')) {
                                btn.classList.add('active-selection');
                            }
                            btn.onclick = () => toggleClientSlot(slotId, hourStr, sType, btn, db, user, weekId, 'book');
                        }
                    } else {
                        // PERSONAL TRAINING or OSTEOPATIA
                        const serviceClass = `service-${sType === 'osteopatia' ? 'osteo' : 'treino'}`;

                        if (slotInfo.status === 'booked') {
                            if (slotInfo.bookedBy === user.uid) {
                                btn.className = `time-slot selected ${serviceClass}`;
                                // Toggle Cancellation selection
                                if (selectedClientSlots.some(s => s.id === slotId && s.action === 'cancel')) {
                                    btn.classList.add('active-selection', 'cancelling');
                                }
                                btn.onclick = () => toggleClientSlot(slotId, hourStr, sType, btn, db, user, weekId, 'cancel', slotInfo);
                            } else {
                                btn.className = 'time-slot booked';
                                btn.style.pointerEvents = 'none';
                            }
                        } else {
                            btn.className = `time-slot available ${serviceClass}`;
                            // Multi-select persistence
                            if (selectedClientSlots.some(s => s.id === slotId && s.action === 'book')) {
                                btn.classList.add('active-selection');
                            }
                            btn.onclick = () => toggleClientSlot(slotId, hourStr, sType, btn, db, user, weekId, 'book');
                        }
                    }
                } else {
                    btn.className = 'time-slot empty';
                    btn.style.pointerEvents = 'none';
                    btn.innerHTML = `${hourStr}<br><span class="indisponivel-text">Indisponível</span>`;
                }
            }
                slotsContainer.appendChild(btn);
            }
        }
        col.appendChild(slotsContainer);
        wrapper.appendChild(col);
    }

    if (isAdmin) setupAdminPublishButton(db, weekId, wrapper);
    if (window.lucide) window.lucide.createIcons();
}

// Admin click cycle: Inactive → Treino (1) → Online (2) → Osteo (3) → Clear (4)
function adminCycleSlot(btn, hourStr) {
    if (!btn.classList.contains('active')) {
        // Click 1: Inactive → Treino (yellow)
        btn.className = 'time-slot admin-selectable active service-treino';
        btn.dataset.serviceType = 'treino';
        btn.textContent = hourStr;
    } else if (btn.classList.contains('service-treino')) {
        // Click 2: Treino → Online (blue)
        btn.className = 'time-slot admin-selectable active service-grupal';
        btn.dataset.serviceType = 'grupal';
        btn.innerHTML = `${hourStr}<br><span class="group-count">0 reservas</span>`;
    } else if (btn.classList.contains('service-grupal')) {
        // Click 3: Grupal → Osteo (white)
        btn.className = 'time-slot admin-selectable active service-osteo';
        btn.dataset.serviceType = 'osteopatia';
        btn.textContent = hourStr;
    } else {
        // Click 4: Osteo → Clear (inactive)
        btn.className = 'time-slot admin-selectable';
        delete btn.dataset.serviceType;
        btn.textContent = hourStr;
    }
}

function openGroupPopup(slotId, slotInfo, db, weekId, userNames, isReadOnly = false) {
    const popup = document.getElementById('group-booking-popup');
    const titleEl = document.getElementById('popup-title');
    const subtitleEl = document.getElementById('popup-subtitle');
    const listEl = document.getElementById('popup-user-list');
    const closeBtn = document.getElementById('popup-close-btn');

    if (!popup) return;

    const datePart = slotId.split('T')[0];
    const timePart = slotId.split('T')[1];
    titleEl.textContent = 'Treino Online';
    subtitleEl.textContent = `${datePart} às ${timePart}`;

    listEl.innerHTML = '';
    const bookedUsers = slotInfo.bookedUsers || [];

    if (bookedUsers.length === 0) {
        listEl.innerHTML = '<div class="empty-group">Nenhum utilizador reservado.</div>';
    } else {
        bookedUsers.forEach(bu => {
            const resolvedName = userNames[bu.uid] || bu.name;
            const displayName = formatDisplayName(resolvedName);
            
            const item = document.createElement('div');
            item.className = 'user-item';
            item.innerHTML = `
                <div class="user-name-popup">
                    <div class="user-dot"></div>
                    <span>${displayName}</span>
                </div>
                ${!isReadOnly ? `
                <button class="remove-user-btn" title="Remover utilizador">
                    <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>` : ''}
            `;
            
            if (!isReadOnly) {
                // Remove user button
                item.querySelector('.remove-user-btn').onclick = async () => {
                    if (confirm(`Deseja remover "${displayName}" deste treino grupal?`)) {
                        await removeUserFromGroup(db, weekId, slotId, bu);
                        // Popup will refresh via onSnapshot
                    }
                };
            }
            
            listEl.appendChild(item);
        });
    }

    // Show popup
    popup.classList.add('active');
    if (window.lucide) window.lucide.createIcons();

    // Close handlers
    const closeHandler = () => {
        popup.classList.remove('active');
        closeBtn.removeEventListener('click', closeHandler);
        popup.removeEventListener('click', bgClickHandler);
    };
    
    const bgClickHandler = (e) => {
        if (e.target === popup) closeHandler();
    };

    closeBtn.addEventListener('click', closeHandler);
    popup.addEventListener('click', bgClickHandler);
}

async function removeUserFromGroup(db, weekId, slotId, userEntry) {
    try {
        const scheduleRef = doc(db, "weekly_schedules", weekId);
        const snap = await getDoc(scheduleRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const slot = data.slots[slotId];
        if (!slot || !slot.bookedUsers) return;

        const updatedUsers = slot.bookedUsers.filter(bu => bu.uid !== userEntry.uid);
        
        await updateDoc(scheduleRef, {
            [`slots.${slotId}.bookedUsers`]: updatedUsers,
            [`slots.${slotId}.bookedCount`]: updatedUsers.length
        });

        // Remove from user's booking history in weekly_schedules
        if (userEntry.uid) {
            try {
                const bookingDocRef = doc(db, "weekly_schedules", `user_${userEntry.uid}`);
                const bookingSnap = await getDoc(bookingDocRef);
                if (bookingSnap.exists()) {
                    const bookings = bookingSnap.data().bookings || [];
                    const filtered = bookings.filter(b => 
                        !(b.serviceType === 'grupal' && b.date === slotId.split('T')[0] && b.time === slotId.split('T')[1])
                    );
                    await updateDoc(bookingDocRef, { bookings: filtered });
                }
            } catch (e) {
                console.warn("Could not remove from user booking history", e);
            }
        }

        alert("Utilizador removido com sucesso!");
    } catch (e) {
        console.error("Error removing user from group:", e);
        alert("Erro ao remover utilizador: " + e.message);
    }
}

function setupAdminPublishButton(db, weekId, gridWrapper) {
    const pubBtn = document.getElementById('btn-publish-week');
    const clearBtn = document.getElementById('btn-clear-availability');
    
    if (pubBtn) {
        const newPubBtn = pubBtn.cloneNode(true);
        pubBtn.parentNode.replaceChild(newPubBtn, pubBtn);
        newPubBtn.addEventListener('click', async () => {
            newPubBtn.disabled = true;
            newPubBtn.textContent = 'A publicar...';

            const slotsMap = {};
            const activeButtons = gridWrapper.querySelectorAll('.time-slot.active');
            activeButtons.forEach(b => {
                const slotId = b.dataset.slotId;
                const sType = b.dataset.serviceType || 'treino';
                
                if (sType === 'grupal') {
                    slotsMap[slotId] = {
                        status: 'available',
                        serviceType: 'grupal',
                        bookedUsers: [],
                        bookedCount: 0
                    };
                } else {
                    slotsMap[slotId] = {
                        status: 'available',
                        bookedBy: null,
                        bookedName: null,
                        serviceType: sType
                    };
                }
            });

            const docRef = doc(db, "weekly_schedules", weekId);
            try {
                const existingSnap = await getDoc(docRef);
                if (existingSnap.exists()) {
                    const existingData = existingSnap.data();
                    Object.keys(existingData.slots || {}).forEach(k => {
                        const existingSlot = existingData.slots[k];
                        // Preserve personal bookings
                        if (existingSlot.status === 'booked') {
                            slotsMap[k] = existingSlot;
                        }
                        // Preserve group bookings that have users
                        if (existingSlot.serviceType === 'grupal' && existingSlot.bookedUsers && existingSlot.bookedUsers.length > 0) {
                            slotsMap[k] = existingSlot;
                        }
                    });
                }
                await setDoc(docRef, {
                    publishedDate: new Date().toISOString(),
                    publishedByAdmin: true,
                    slots: slotsMap
                }, { merge: true });
                alert("Semana publicada com sucesso!");
                window.location.reload();
            } catch (e) {
                console.error(e);
                alert("Erro ao publicar");
            }
            newPubBtn.disabled = false;
            newPubBtn.innerHTML = '<i data-lucide="send" style="width: 18px; height: 18px; margin-right: 8px;"></i> Publicar Semana';
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.addEventListener('click', async () => {
            if (confirm("Tem certeza que deseja remover todos os horários disponíveis (não reservados)? Reservas de clientes não serão afetadas.")) {
                newClearBtn.disabled = true;
                await clearUnbookedSlots(db, weekId);
                newClearBtn.disabled = false;
            }
        });
    }
}

function toggleClientSlot(slotId, time, serviceType, btn, db, user, weekId, action = 'book', slotData = null) {
    const index = selectedClientSlots.findIndex(s => s.id === slotId);
    if (index > -1) {
        selectedClientSlots.splice(index, 1);
        btn.classList.remove('active-selection', 'cancelling');
        btn.innerHTML = time;
    } else {
        selectedClientSlots.push({ id: slotId, time, serviceType, action, slotData });
        btn.classList.add('active-selection');
        if (action === 'cancel') {
            btn.classList.add('cancelling');
            btn.innerHTML = `${time}<br><span style="font-size: 0.7rem; font-weight: 900; opacity: 1; display: block; margin-top: 2px;">CANCELAR</span>`;
        }
    }
    updateBookingSummary(db, user, weekId);
    if (window.lucide) window.lucide.createIcons();
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

    const bookings = selectedClientSlots.filter(s => s.action === 'book');
    const cancellations = selectedClientSlots.filter(s => s.action === 'cancel');

    if (bookings.length > 0) {
        const title = document.createElement('h5');
        title.className = 'summary-title';
        title.textContent = "Novas Reservas";
        summaryList.appendChild(title);
        bookings.forEach(slot => {
            const item = createSummaryItem(slot);
            summaryList.appendChild(item);
        });
    }

    if (cancellations.length > 0) {
        const title = document.createElement('h5');
        title.className = 'summary-title cancellation';
        title.textContent = "Cancelamentos";
        summaryList.appendChild(title);
        cancellations.forEach(slot => {
            const item = createSummaryItem(slot, true);
            summaryList.appendChild(item);
        });
    }

    confirmBtn.textContent = `Confirmar Alterações (${selectedClientSlots.length})`;
    
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
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let userName = user.email || user.displayName || "Utilizador";
            if (userDoc.exists()) {
                userName = userDoc.data().name || userName;
            }

            const batch = writeBatch(db);
            const scheduleRef = doc(db, "weekly_schedules", weekId);
            const bookingDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
            
            const bookingsToSave = [];
            const bookingsToRemove = [];

            // We need to handle group bookings specially (can't use batch for arrayUnion on nested)
            const groupBookActions = [];

            selectedClientSlots.forEach(slot => {
                if (slot.action === 'book') {
                    if (slot.serviceType === 'grupal') {
                        // Group booking — we'll handle after batch
                        groupBookActions.push({
                            slotId: slot.id,
                            action: 'add',
                            userData: {
                                uid: user.uid,
                                name: userName,
                                timestamp: new Date().toISOString()
                            },
                            bookingHistory: {
                                status: 'booked',
                                bookedBy: user.uid,
                                bookedName: userName,
                                serviceType: 'grupal',
                                timestamp: new Date().toISOString(),
                                time: slot.time,
                                date: slot.id.split('T')[0]
                            }
                        });
                    } else {
                        // Personal booking
                        const bookingData = {
                            status: 'booked',
                            bookedBy: user.uid,
                            bookedName: userName,
                            serviceType: slot.serviceType,
                            timestamp: new Date().toISOString(),
                            time: slot.time,
                            date: slot.id.split('T')[0]
                        };
                        batch.set(scheduleRef, { slots: { [slot.id]: bookingData } }, { merge: true });
                        bookingsToSave.push(bookingData);
                    }
                } else {
                    if (slot.serviceType === 'grupal') {
                        // Group cancellation
                        groupBookActions.push({
                            slotId: slot.id,
                            action: 'remove',
                            uid: user.uid,
                            bookingHistory: {
                                status: 'booked',
                                bookedBy: user.uid,
                                bookedName: userName,
                                serviceType: 'grupal',
                                time: slot.time,
                                date: slot.id.split('T')[0]
                            }
                        });
                    } else {
                        // Personal cancellation: revert to available
                        const cancelData = {
                            status: 'available',
                            bookedBy: null,
                            bookedName: null,
                            serviceType: slot.serviceType
                        };
                        batch.set(scheduleRef, { slots: { [slot.id]: cancelData } }, { merge: true });
                        if (slot.slotData) bookingsToRemove.push(slot.slotData);
                    }
                }
            });

            // Update user's booking history in weekly_schedules/user_{uid}
            // We can't use batch for this easily since we need to read first, so do it after commit
            // (bookingsToSave and bookingsToRemove will be processed after batch)

            await batch.commit();

            // Handle group booking actions sequentially (need current data)
            for (const ga of groupBookActions) {
                const schedSnap = await getDoc(scheduleRef);
                const schedData = schedSnap.exists() ? schedSnap.data() : { slots: {} };
                const currentSlot = schedData.slots[ga.slotId] || { serviceType: 'grupal', bookedUsers: [], bookedCount: 0 };
                let currentUsers = currentSlot.bookedUsers || [];

                if (ga.action === 'add') {
                    // Add user to group
                    if (!currentUsers.some(u => u.uid === user.uid)) {
                        currentUsers.push(ga.userData);
                    }
                    await updateDoc(scheduleRef, {
                        [`slots.${ga.slotId}.bookedUsers`]: currentUsers,
                        [`slots.${ga.slotId}.bookedCount`]: currentUsers.length
                    });
                    // Add to user history in weekly_schedules
                    const bDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
                    const bSnap = await getDoc(bDocRef);
                    const existingBookings = bSnap.exists() ? (bSnap.data().bookings || []) : [];
                    existingBookings.push(ga.bookingHistory);
                    await setDoc(bDocRef, { uid: user.uid, email: user.email, bookings: existingBookings }, { merge: true });
                } else if (ga.action === 'remove') {
                    // Remove user from group
                    currentUsers = currentUsers.filter(u => u.uid !== user.uid);
                    await updateDoc(scheduleRef, {
                        [`slots.${ga.slotId}.bookedUsers`]: currentUsers,
                        [`slots.${ga.slotId}.bookedCount`]: currentUsers.length
                    });
                    // Remove from user history in weekly_schedules
                    try {
                        const bDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
                        const bSnap = await getDoc(bDocRef);
                        if (bSnap.exists()) {
                            const bookings = bSnap.data().bookings || [];
                            const filtered = bookings.filter(h =>
                                !(h.serviceType === 'grupal' &&
                                h.date === ga.bookingHistory.date &&
                                h.time === ga.bookingHistory.time)
                            );
                            await updateDoc(bDocRef, { bookings: filtered });
                        }
                    } catch (e) {
                        console.warn("Could not remove group booking from history", e);
                    }
                }
            }
            
            // Save personal bookings/cancellations to user history
            if (bookingsToSave.length > 0 || bookingsToRemove.length > 0) {
                const bDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
                const bSnap = await getDoc(bDocRef);
                let existingBookings = bSnap.exists() ? (bSnap.data().bookings || []) : [];
                
                // Add new bookings
                bookingsToSave.forEach(b => existingBookings.push(b));
                
                // Remove cancelled bookings
                bookingsToRemove.forEach(rem => {
                    existingBookings = existingBookings.filter(b =>
                        !(b.date === rem.date && b.time === rem.time && b.serviceType === rem.serviceType)
                    );
                });
                
                await setDoc(bDocRef, { uid: user.uid, email: user.email, bookings: existingBookings }, { merge: true });
            }
            
            // Combine personal and group bookings for calendar integration
            const allNewBookings = [
                ...bookingsToSave,
                ...groupBookActions.filter(ga => ga.action === 'add').map(ga => ga.bookingHistory)
            ];
            
            showSuccessScreen(allNewBookings);

        } catch (e) {
            console.error(e);
            alert("Erro ao processar as alterações.");
            confirmBtn.disabled = false;
        }
    };
}

function createSummaryItem(slot, isCancellation = false) {
    const item = document.createElement('div');
    item.className = `summary-item ${isCancellation ? 'cancellation' : ''}`;
    let sName = 'Treino Personalizado';
    if (slot.serviceType === 'osteopatia') sName = 'Osteopatia';
    else if (slot.serviceType === 'grupal') sName = 'Online';
    item.innerHTML = `
        <span><strong>${sName}</strong> - ${slot.time} (${slot.id.split('T')[0]})</span>
        <button class="remove-slot" data-slot-id="${slot.id}">&times;</button>
    `;
    return item;
}

async function cancelAdminBooking(db, weekId, slotId, slotInfo) {
    try {
        const scheduleRef = doc(db, "weekly_schedules", weekId);
        
        // 1. Revert slot to available
        await updateDoc(scheduleRef, {
            [`slots.${slotId}`]: {
                status: 'available',
                bookedBy: null,
                bookedName: null,
                serviceType: 'treino'
            }
        });

        // 2. Remove from user booking history in weekly_schedules
        if (slotInfo.bookedBy) {
            try {
                const bookingDocRef = doc(db, "weekly_schedules", `user_${slotInfo.bookedBy}`);
                const bookingSnap = await getDoc(bookingDocRef);
                if (bookingSnap.exists()) {
                    const bookings = bookingSnap.data().bookings || [];
                    const filtered = bookings.filter(b => 
                        !(b.date === slotId.split('T')[0] && b.time === slotId.split('T')[1])
                    );
                    await updateDoc(bookingDocRef, { bookings: filtered });
                }
            } catch (e) {
                console.warn("Could not remove from user booking doc", e);
            }
        }

        alert("Reserva removida com sucesso!");
    } catch (e) {
        console.error("Error cancelling booking:", e);
        alert("Erro ao remover reserva: " + e.message);
    }
}

async function clearUnbookedSlots(db, weekId) {
    try {
        const docRef = doc(db, "weekly_schedules", weekId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const slots = data.slots || {};
        const updates = {};
        
        let clearedCount = 0;
        Object.keys(slots).forEach(sid => {
            const slot = slots[sid];
            // Don't clear personal bookings
            if (slot.status === 'booked') return;
            // Don't clear group slots that have users
            if (slot.serviceType === 'grupal' && slot.bookedUsers && slot.bookedUsers.length > 0) return;
            
            updates[`slots.${sid}`] = deleteField();
            clearedCount++;
        });

        if (clearedCount === 0) {
            alert("Não há horários disponíveis para limpar.");
            return;
        }

        await updateDoc(docRef, updates);
        alert(`${clearedCount} horários disponíveis foram removidos.`);
    } catch (e) {
        console.error(e);
        alert("Erro ao limpar horários.");
    }
}

// Global Agenda Handlers
window.openGlobalAgenda = async function() {
    const dashboardActions = document.getElementById('dashboard-main-actions');
    const previewSection = document.getElementById('dashboard-preview-section');
    const globalAgenda = document.getElementById('global-agenda-section');
    
    if (dashboardActions) dashboardActions.classList.add('hidden');
    if (previewSection) previewSection.classList.add('hidden');
    if (globalAgenda) globalAgenda.classList.remove('hidden');
    
    const { auth, db } = await import('./firebase-config.js');
    renderAdminGrid(db, auth.currentUser);
};

window.closeGlobalAgenda = function() {
    const dashboardActions = document.getElementById('dashboard-main-actions');
    const previewSection = document.getElementById('dashboard-preview-section');
    const globalAgenda = document.getElementById('global-agenda-section');
    
    if (dashboardActions) dashboardActions.classList.remove('hidden');
    if (previewSection) previewSection.classList.remove('hidden');
    if (globalAgenda) globalAgenda.classList.add('hidden');
};

window.changeGlobalWeek = async function(offset) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
    
    const weekHeaders = document.querySelectorAll('.current-week');
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    
    const formatter = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });
    const weekText = `${formatter.format(currentWeekStart)} - ${formatter.format(endDate)}`;
    weekHeaders.forEach(el => el.textContent = weekText);
    
    const { auth, db } = await import('./firebase-config.js');
    renderAdminGrid(db, auth.currentUser);
};

// --- Calendar Integration ---
function showSuccessScreen(bookings) {
    const container = document.getElementById('calendar-sync-container');
    if (!container) return; // Se por acaso não existir
    container.innerHTML = ''; // Clear

    if (!bookings || bookings.length === 0) {
        goToStep(5);
        return;
    }

    // Build ICS string
    let vEvents = '';
    const now = new Date();
    const nowICS = now.toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
    
    bookings.forEach((b, index) => {
        const dateStr = b.date; // YYYY-MM-DD
        const timeStr = b.time; // HH:mm
        const duration = b.serviceType === 'osteopatia' ? 60 : 30;
        
        const startMoment = new Date(`${dateStr}T${timeStr}:00`);
        const endMoment = new Date(startMoment.getTime() + duration * 60000);
        
        const dtStartICSLocal = `${dateStr.replace(/-/g, '')}T${timeStr.replace(':', '')}00`;
        const dtEndICSLocal = `${endMoment.getFullYear()}${String(endMoment.getMonth()+1).padStart(2,'0')}${String(endMoment.getDate()).padStart(2,'0')}T${String(endMoment.getHours()).padStart(2,'0')}${String(endMoment.getMinutes()).padStart(2,'0')}00`;
        
        // Add to global ICS
        vEvents += `BEGIN:VEVENT\r\n` +
                   `UID:${dateStr}T${timeStr}-${index}@pmorais.pt\r\n` +
                   `DTSTAMP:${nowICS}\r\n` +
                   `DTSTART;TZID=Europe/Lisbon:${dtStartICSLocal}\r\n` +
                   `DTEND;TZID=Europe/Lisbon:${dtEndICSLocal}\r\n` +
                   `SUMMARY:Sessão de ${b.serviceType} com Paulo Morais\r\n` +
                   `DESCRIPTION:Reserva confirmada.\r\n` +
                   `END:VEVENT\r\n`;

        // Let's add Google Calendar link for each booking (up to 3 to not clutter UI)
        if (index < 3) {
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sess%C3%A3o+de+${encodeURIComponent(b.serviceType)}+com+Paulo+Morais&dates=${dtStartICSLocal}/${dtEndICSLocal}&details=Reserva+confirmada.&ctz=Europe/Lisbon`;
            
            const btnGcal = document.createElement('a');
            btnGcal.href = gcalUrl;
            btnGcal.target = "_blank";
            btnGcal.className = "btn btn-outline";
            btnGcal.style = "width: 100%; max-width: 300px; display: flex; align-items: center; justify-content: center; gap: 8px;";
            btnGcal.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.24 16L12 14.34 7.76 18l-.94-.94L11.06 12 6.82 7.76l.94-.94L12 10.06l4.24-3.24.94.94L13.94 12l4.24 4.24-.94.94z" fill="#4285F4"/></svg> Google Calendar (${dateStr.split('-').reverse().join('/')})`;
            container.appendChild(btnGcal);
        }
    });

    // If there's more than 3 bookings, show a note
    if (bookings.length > 3) {
        const note = document.createElement('p');
        note.className = "color-text-dim";
        note.style.fontSize = "0.85rem";
        note.innerText = `+${bookings.length - 3} sessões adicionais. Descarregue o ficheiro ICS abaixo para adicionar todas.`;
        container.appendChild(note);
    }

    if (vEvents) {
        const icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Paulo Morais//Agenda//PT\r\nCALSCALE:GREGORIAN\r\n${vEvents}END:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const btnICS = document.createElement('a');
        btnICS.href = url;
        btnICS.download = 'reserva_paulo_morais.ics';
        btnICS.className = "btn btn-primary";
        btnICS.style = "width: 100%; max-width: 300px; display: flex; align-items: center; justify-content: center; gap: 8px;";
        btnICS.innerHTML = `<i data-lucide="calendar"></i> Apple / Outlook (.ics)`;
        container.appendChild(btnICS);
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    goToStep(5);
}
