import {
    doc,
    setDoc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ADMIN_EMAIL = "pt@pmorais.pt";
let currentWeekStart = new Date(); // We will align this to Monday
// Logic to align to current week's Monday
const day = currentWeekStart.getDay() || 7;  // 1-7, Mon-Sun
if (day !== 1) currentWeekStart.setHours(-24 * (day - 1));
currentWeekStart.setHours(0, 0, 0, 0);

export function initCalendarMode(user, db) {
    const calendarSection = document.getElementById('calendar-section');
    const adminSection = document.getElementById('admin-calendar-section');

    // Update Week Headers
    const weekHeaders = document.querySelectorAll('.current-week');
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const formatter = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });
    const weekText = `${formatter.format(currentWeekStart)} - ${formatter.format(endDate)}`;
    weekHeaders.forEach(el => el.textContent = weekText);

    // Safety check just in case we're not on the profile page
    if (!calendarSection || !adminSection) return;

    if (user.email === ADMIN_EMAIL) {
        // Show Admin Mode
        adminSection.classList.remove('hidden');
        calendarSection.classList.add('hidden');
        renderAdminGrid(db, user);
    } else {
        // Show Client Mode
        calendarSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        renderClientGrid(db, user);
    }
}

function getWeekId(dateObj) {
    // Format e.g., "2026-W08" or just simple YYYY-MM-DD of the Monday
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

    // Listen to changes in real-time
    onSnapshot(docRef, (docSnap) => {
        let scheduleData = null;
        if (docSnap.exists()) {
            scheduleData = docSnap.data();
        }
        buildGrid(gridEl, scheduleData, false, db, user, weekId);
    }, (error) => {
        console.error("Firebase Read Error:", error);
        // Fallback: draw empty grid if permission denied
        buildGrid(gridEl, null, false, db, user, weekId);
        gridEl.innerHTML = `<p style="color:var(--color-primary); width: 100%; text-align: center; margin-top: 20px;">Permisos de Lectura Bloqueados (Actualice Firestore Rules)</p>` + gridEl.innerHTML;
    });
}

function renderAdminGrid(db, user) {
    const gridEl = document.getElementById('admin-weekly-grid');
    if (!gridEl) return;

    const weekId = getWeekId(currentWeekStart);
    const docRef = doc(db, "weekly_schedules", weekId);

    // Fetch once or listen (listening helps if they open multiple tabs, but let's just use onSnapshot to be consistent)
    onSnapshot(docRef, (docSnap) => {
        let scheduleData = null;
        if (docSnap.exists()) {
            scheduleData = docSnap.data();
        }
        buildGrid(gridEl, scheduleData, true, db, user, weekId);
    }, (error) => {
        console.error("Firebase Admin Read Error:", error);
        // Fallback: draw empty admin grid if permission denied
        buildGrid(gridEl, null, true, db, user, weekId);
        gridEl.innerHTML = `<p style="color:var(--color-primary); width: 100%; text-align: center; margin-top: 20px;">Permisos de Lectura Bloqueados (Actualice Firestore Rules)</p>` + gridEl.innerHTML;
    });
}

function buildGrid(wrapper, data, isAdmin, db, user, weekId) {
    wrapper.innerHTML = "";
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    // We render slots from 07:00 to 20:00 just doing full hours for simplicity
    const startHour = 7;
    const endHour = 20;

    let selectedAdminSlots = data && data.slots ? new Set(Object.keys(data.slots)) : new Set();

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
                // Is this slot booked by someone?
                if (data && data.slots && data.slots[slotId] && data.slots[slotId].status === 'booked') {
                    btn.className = 'time-slot admin-booked';
                    btn.innerHTML = `${hourStr}<br><span class="client-name">${data.slots[slotId].bookedName || 'Ocupado'}</span>`;
                    btn.disabled = true; // Prevent unpublishing
                } else {
                    btn.className = 'time-slot admin-selectable';
                    // Active if already saved
                    if (selectedAdminSlots.has(slotId)) {
                        btn.classList.add('active');
                    }

                    // Toggle purely visual for admin before publishing
                    btn.onclick = () => {
                        btn.classList.toggle('active');
                    }
                }
            } else {
                // Client Logic
                if (data && data.slots && data.slots[slotId]) {
                    const slotInfo = data.slots[slotId];
                    if (slotInfo.status === 'booked') {
                        if (slotInfo.bookedBy === user.uid) {
                            btn.className = 'time-slot selected'; // Mine!
                        } else {
                            btn.className = 'time-slot booked'; // Taken by someone else
                            btn.disabled = true;
                        }
                    } else {
                        // available
                        btn.className = 'time-slot available';
                        btn.onclick = () => selectClientSlot(db, user, weekId, slotId, btn);
                    }
                } else {
                    // Paulo hasn't opened this slot
                    btn.className = 'time-slot empty';
                    btn.disabled = true;
                }
            }
            slotsContainer.appendChild(btn);
        }
        col.appendChild(slotsContainer);
        wrapper.appendChild(col);
    }

    if (isAdmin) {
        setupAdminPublishButton(db, weekId, wrapper);
    }
}

function setupAdminPublishButton(db, weekId, gridWrapper) {
    const pubBtn = document.getElementById('btn-publish-week');
    if (!pubBtn) return;

    // Remove old listeners by recreating button (clone)
    const newBtn = pubBtn.cloneNode(true);
    pubBtn.parentNode.replaceChild(newBtn, pubBtn);

    newBtn.addEventListener('click', async () => {
        newBtn.disabled = true;
        newBtn.textContent = 'A publicar...';

        // Collect all active slots
        const slotsMap = {};
        const activeButtons = gridWrapper.querySelectorAll('.time-slot.active');
        activeButtons.forEach(b => {
            const slotId = b.dataset.slotId;
            slotsMap[slotId] = {
                status: 'available',
                bookedBy: null,
                bookedName: null
            };
        });

        // Current doc data to avoid overwriting booked slots
        const docRef = doc(db, "weekly_schedules", weekId);
        try {
            const existingSnap = await getDoc(docRef);
            if (existingSnap.exists()) {
                const existingData = existingSnap.data();
                // Merge existing booked slots back into the map so Paulo doesn't delete someone's booking
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
            console.error("Error publishing week", e);
            alert("Erro ao publicar");
        }

        newBtn.disabled = false;
        newBtn.innerHTML = '<i data-lucide="send" style="width: 18px; height: 18px; margin-right: 8px;"></i> Publicar Semana';
        if (window.lucide) window.lucide.createIcons();
    });
}

function selectClientSlot(db, user, weekId, slotId, btn) {
    // Toggle the selection state instead of replacing
    btn.classList.toggle('selected');
    btn.classList.toggle('active-selection');

    const container = document.getElementById('calendar-section');
    const selectedButtons = container.querySelectorAll('.time-slot.selected');
    const confirmBtn = document.getElementById('btn-confirm-booking');

    if (!confirmBtn) return;

    if (selectedButtons.length === 0) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Confirmar Reserva";
        return;
    }

    confirmBtn.disabled = false;
    if (selectedButtons.length === 1) {
        let uiDateText = selectedButtons[0].dataset.slotId.split('T');
        confirmBtn.textContent = `Confirmar Reserva (${uiDateText[1]} - ${uiDateText[0]})`;
    } else {
        confirmBtn.textContent = `Confirmar ${selectedButtons.length} Reservas`;
    }

    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "A processar...";
        try {
            const docRef = doc(db, "weekly_schedules", weekId);
            const updateField = {};

            // Loop through all currently selected slots to build the update merge packet
            selectedButtons.forEach(b => {
                let thisSlotId = b.dataset.slotId;
                updateField[`slots.${thisSlotId}`] = {
                    status: 'booked',
                    bookedBy: user.uid,
                    bookedName: user.email // Or fetch user name from db
                };
            });

            await setDoc(docRef, updateField, { merge: true });
            alert(`Reserva(s) confirmada(s) con suceso! (${selectedButtons.length} horários)`);
        } catch (e) {
            console.error(e);
            alert("Alguém foi mais rápido ou ocorreu um erro.");
        }
        // Cleanup UI will automatically happen due to onSnapshot receiving the new data!
        confirmBtn.textContent = "Confirmar Reserva";
        confirmBtn.disabled = true;
    }
}
