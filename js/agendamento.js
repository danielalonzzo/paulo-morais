// js/agendamento.js
// Logic for Step-by-Step Booking System (Wizard)

let bookingData = {
    category: null,
    modality: null,
    date: null,
    isoDate: null,
    time: null,
    serviceName: null,
    selections: []
};

const modalitiesData = {
    osteopatia: [
        { id: 'ost_primeira', name: 'Primeira Consulta', icon: 'clipboard-list', desc: 'Avaliação inicial e tratamento (60 min)' },
        { id: 'ost_seguimento', name: 'Consulta de Seguimento', icon: 'activity', desc: 'Sessão de acompanhamento (45 min)' }
    ],
    treino: [
        { id: 'tr_presencial', name: 'Personalizado Presencial', icon: 'user', desc: 'Treino individual 1 para 1 (30 min)' },
        { id: 'tr_online', name: 'Treino Online', icon: 'laptop', desc: 'Acompanhamento à distância grupal (60 min)' }
    ]
};

// State Management
function goToStep(stepNumber) {
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    updateBreadcrumbs(stepNumber);
    
    if (stepNumber === 3) {
        renderCalendar();
    } else if (stepNumber === 4) {
        renderCartSummary();
    }
}

function updateBreadcrumbs(stepNumber) {
    const breadcrumbs = document.getElementById('booking-breadcrumbs');
    let html = '';
    
    if (stepNumber >= 2 && bookingData.category) {
        const catName = bookingData.category === 'osteopatia' ? 'Osteopatia' : 'Treino';
        html += `<span class="breadcrumb-item" onclick="goToStep(1)">${catName}</span>`;
    }
    if (stepNumber >= 3 && bookingData.modality) {
        html += `<span class="breadcrumb-separator">&gt;</span> <span class="breadcrumb-item" onclick="goToStep(2)">${bookingData.serviceName}</span>`;
    }
    if (stepNumber >= 4 && bookingData.selections && bookingData.selections.length > 0) {
        const count = bookingData.selections.length;
        const text = count === 1 ? '1 Sessão' : `${count} Sessões`;
        html += `<span class="breadcrumb-separator">&gt;</span> <span class="breadcrumb-item" onclick="goToStep(3)">${text}</span>`;
    }
    
    breadcrumbs.innerHTML = html;
}

// Step 1: Category Selection
function selectCategory(cat) {
    bookingData.category = cat;
    
    if (cat === 'osteopatia') {
        bookingData.modality = 'osteopatia';
        bookingData.serviceName = 'Osteopatia';
        goToStep(3);
        return;
    }
    
    // Build Modalities Grid
    const grid = document.getElementById('modalities-grid');
    grid.innerHTML = '';
    
    modalitiesData[cat].forEach(mod => {
        const div = document.createElement('div');
        div.className = 'option-card';
        div.onclick = () => selectModality(mod.id, mod.name);
        div.innerHTML = `
            <div class="option-icon"><i data-lucide="${mod.icon}"></i></div>
            <h3 class="option-title">${mod.name}</h3>
            <p class="color-text-dim">${mod.desc}</p>
        `;
        grid.appendChild(div);
    });
    
    if (window.lucide) window.lucide.createIcons();
    goToStep(2);
}

// Step 2: Modality Selection
function selectModality(id, name) {
    bookingData.modality = id;
    bookingData.serviceName = name;
    goToStep(3);
}

// Step 3: Calendar Logic
let currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();
let displayDate = new Date(currentYear, currentMonth, 1);

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function renderCalendar() {
    const month = displayDate.getMonth();
    const year = displayDate.getFullYear();
    
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendar-days');
    // Keep header (7 days)
    grid.innerHTML = `
        <div class="day-name">Dom</div><div class="day-name">Seg</div><div class="day-name">Ter</div>
        <div class="day-name">Qua</div><div class="day-name">Qui</div><div class="day-name">Sex</div><div class="day-name">Sáb</div>
    `;
    
    // Empty slots before 1st
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div></div>`;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 1; i <= daysInMonth; i++) {
        const loopDate = new Date(year, month, i);
        let classNames = 'calendar-day';
        
        // Disable past days and Sundays (0)
        if (loopDate < today || loopDate.getDay() === 0) {
            classNames += ' disabled';
            grid.innerHTML += `<div class="${classNames}">${i}</div>`;
        } else {
            classNames += ' available';
            // Selected logic
            const dateStr = `${i.toString().padStart(2,'0')}/${(month+1).toString().padStart(2,'0')}/${year}`;
            const isoDateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
            
            if (bookingData.date === dateStr) {
                classNames += ' active-view';
                // Inline style for active view so it stands out even without a specific CSS class
                grid.innerHTML += `<div class="${classNames}" style="border: 2px solid var(--color-primary); font-weight: bold;" onclick="selectDate(${i}, ${month}, ${year})">${i}</div>`;
            } else if (bookingData.selections.some(s => s.isoDate === isoDateStr)) {
                classNames += ' selected';
                grid.innerHTML += `<div class="${classNames}" onclick="selectDate(${i}, ${month}, ${year})">${i}</div>`;
            } else {
                grid.innerHTML += `<div class="${classNames}" onclick="selectDate(${i}, ${month}, ${year})">${i}</div>`;
            }
        }
    }
}

function changeMonth(offset) {
    displayDate.setMonth(displayDate.getMonth() + offset);
    renderCalendar();
    document.getElementById('time-slots-container').style.display = 'none';
    bookingData.date = null;
    bookingData.time = null;
    document.getElementById('btn-continue-form').disabled = true;
}

function selectDate(day, month, year) {
    const dateStr = `${day.toString().padStart(2,'0')}/${(month+1).toString().padStart(2,'0')}/${year}`;
    const dateObj = new Date(year, month, day);
    const isoDateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
    
    bookingData.date = dateStr;
    bookingData.isoDate = isoDateStr;
    bookingData.time = null;
    document.getElementById('btn-continue-form').disabled = bookingData.selections.length === 0;
    
    renderCalendar(); // re-render to show selected style
    
    const timeSlotsDiv = document.getElementById('time-slots');
    timeSlotsDiv.innerHTML = '<p class="color-text-dim text-center">A carregar horários...</p>';
    document.getElementById('time-slots-container').style.display = 'block';

    // Calculate Week ID
    const weekStart = new Date(dateObj);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    const weekYear = weekStart.getFullYear();
    const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
    const weekDay = String(weekStart.getDate()).padStart(2, '0');
    const weekId = `${weekYear}-${weekMonth}-${weekDay}`;

    if (window.loadAdminWizardSchedule) {
        window.loadAdminWizardSchedule(weekId, (loadedSlots) => {
            renderClientTimeSlots(loadedSlots, isoDateStr);
        });
    } else {
        timeSlotsDiv.innerHTML = '<p class="color-text-dim text-center">Erro ao carregar horários.</p>';
    }
}

function renderClientTimeSlots(loadedSlots, isoDateStr) {
    const timeSlotsDiv = document.getElementById('time-slots');
    timeSlotsDiv.innerHTML = '';
    
    let serviceClass = '';
    let durationSlots = 1; // 1 slot = 30min
    
    if (bookingData.category === 'osteopatia') {
        serviceClass = 'service-osteopatia';
        durationSlots = 2; // 60 mins
    } else {
        if (bookingData.modality === 'tr_presencial') {
            serviceClass = 'service-treino_personalizado';
            durationSlots = 1; // 30 mins
        }
        if (bookingData.modality === 'tr_online') {
            serviceClass = 'service-grupal';
            durationSlots = 2; // 60 mins
        }
    }
    
    const baseSlots = [];
    for (let h = 6; h <= 20; h++) {
        for (let m of ['00', '30']) {
            baseSlots.push(`${h.toString().padStart(2,'0')}:${m}`);
        }
    }
    
    let hasAvailableSlots = false;
    
    for (let i = 0; i < baseSlots.length; i++) {
        let isAvailable = true;
        let isOnlineGroup = false;
        let onlineCount = 0;
        let userAlreadyBookedHere = false;
        
        for (let j = 0; j < durationSlots; j++) {
            if (i + j >= baseSlots.length) {
                isAvailable = false;
                break;
            }
            const checkTime = baseSlots[i + j];
            const checkSlotId = `${isoDateStr}T${checkTime}`;
            const slotData = loadedSlots[checkSlotId];
            
            if (slotData) {
                if (slotData.status === 'blocked') {
                    isAvailable = false;
                    break;
                }
                
                // Check if the current user already has a personal booking here
                if (slotData.status === 'booked' && slotData.bookedBy) {
                    // This slot is taken by someone (personal booking)
                    if (bookingData.modality === 'tr_online' && slotData.serviceType === 'grupal') {
                        // It's a group slot, still joinable
                        isOnlineGroup = true;
                        onlineCount = slotData.bookedCount || (slotData.bookedUsers ? slotData.bookedUsers.length : 0);
                    } else {
                        isAvailable = false;
                        break;
                    }
                }
                
                if (bookingData.modality === 'tr_online' && slotData.serviceType === 'grupal') {
                    isOnlineGroup = true;
                    onlineCount = slotData.bookedCount || (slotData.bookedUsers ? slotData.bookedUsers.length : 0);
                } else if (slotData.status === 'booked' || (slotData.serviceType && slotData.serviceType !== 'available')) {
                    isAvailable = false;
                    break;
                }
            }
        }
        
        if (isAvailable) {
            hasAvailableSlots = true;
            const time = baseSlots[i];
            const div = document.createElement('div');
            const isSelected = bookingData.selections.some(s => s.isoDate === isoDateStr && s.time === time);
            div.className = `time-slot ${serviceClass} ${isSelected ? 'selected' : ''}`;
            
            if (isOnlineGroup) {
                div.innerHTML = `${time}<br><small>${onlineCount} inscrito(s)</small>`;
            } else {
                div.innerText = time;
            }
            
            div.onclick = (e) => selectTime(time, div, isoDateStr, bookingData.date);
            timeSlotsDiv.appendChild(div);
        }
    }
    
    if (!hasAvailableSlots) {
        timeSlotsDiv.innerHTML = '<p class="color-text-dim text-center">Sem vagas para esta duração.</p>';
    }
}

function selectTime(time, element, isoDateStr, dateStr) {
    const idx = bookingData.selections.findIndex(s => s.isoDate === isoDateStr && s.time === time);
    
    if (idx !== -1) {
        // Deselect
        bookingData.selections.splice(idx, 1);
        element.classList.remove('selected');
    } else {
        // Select
        bookingData.selections.push({ isoDate: isoDateStr, dateStr, time });
        element.classList.add('selected');
    }
    
    document.getElementById('btn-continue-form').disabled = bookingData.selections.length === 0;
    renderCalendar(); // Refresh calendar to show days with selections
}

// Step 4: Checkout Summary
function renderCartSummary() {
    const summary = document.getElementById('cart-summary');
    
    // Sort selections chronologically
    const sortedSelections = [...bookingData.selections].sort((a, b) => {
        const timeA = new Date(`${a.isoDate}T${a.time}`);
        const timeB = new Date(`${b.isoDate}T${b.time}`);
        return timeA - timeB;
    });
    
    const sessionsList = sortedSelections.map(s => `<li>${s.dateStr} às ${s.time}</li>`).join('');
    
    summary.innerHTML = `
        <h4 style="margin-bottom:10px; font-weight:800; text-transform:uppercase;">Resumo da Reserva</h4>
        <p><strong>Serviço:</strong> ${bookingData.serviceName}</p>
        <p><strong>Sessões Selecionadas:</strong></p>
        <ul style="margin-bottom: 15px; padding-left: 20px;">${sessionsList}</ul>
        <p><strong>Notas adicionais (Opcional)</strong></p>
    `;
}

// Submission
async function submitBooking(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btn-submit-booking');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "A agendar...";
    }
    
    const name = document.getElementById('b_name')?.value || '';
    const email = document.getElementById('b_email')?.value || '';
    const phone = document.getElementById('b_phone')?.value || '';
    const notes = document.getElementById('b_notes')?.value || '';
    
    const payload = {
        ...bookingData,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        notes: notes
    };
    
    // Duration
    let durationSlots = 1;
    if (payload.category === 'osteopatia') durationSlots = 2;
    if (payload.modality === 'tr_online') durationSlots = 2;
    
    // weekId calculation removed since auth.js will handle multiple weeks
    
    if (window.submitWizardBooking) {
        try {
            await window.submitWizardBooking(payload, durationSlots);
            goToStep(5);
            // Clear selections after success
            bookingData.selections = [];
        } catch (err) {
            alert(err.message || "Erro ao efetuar reserva.");
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Confirmar Marcação";
            }
        }
    } else {
        alert("Sistema de reservas temporariamente indisponível.");
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Confirmar Marcação";
        }
    }
}
window.submitBooking = submitBooking;

// --- ADMIN AGENDA LOGIC --- //
let adminCurrentDate = new Date();
// Find the previous Sunday to start the week
let dayOfWeek = adminCurrentDate.getDay(); 
adminCurrentDate.setDate(adminCurrentDate.getDate() - dayOfWeek);

let adminSelectedService = null;
let adminSelectedDay = null; // Store the exact Date of selected day
let adminAvailability = {}; // e.g. { "YYYY-MM-DD": ["09:00", "10:00"] }

window.openAdminBookingWizard = function() {
    const wrapper = document.getElementById('admin-calendar-grid-wrapper');
    if (wrapper) {
        wrapper.style.opacity = '1';
        wrapper.style.pointerEvents = 'auto';
    }
    fetchAdminScheduleAndRender();
};

window.changeAdminWeek = function(offset) {
    adminCurrentDate.setDate(adminCurrentDate.getDate() + (offset * 7));
    document.getElementById('admin-time-slots-container').style.display = 'none';
    adminSelectedDay = null;
    fetchAdminScheduleAndRender();
};

let currentLoadedWeekId = null;

function fetchAdminScheduleAndRender() {
    const year = adminCurrentDate.getFullYear();
    const month = String(adminCurrentDate.getMonth() + 1).padStart(2, '0');
    const day = String(adminCurrentDate.getDate()).padStart(2, '0');
    const weekId = `${year}-${month}-${day}`;
    
    // Only fetch if we haven't loaded this week yet, to prevent wiping unsaved changes when changing the service dropdown
    if (window.loadAdminWizardSchedule && currentLoadedWeekId !== weekId) {
        window.loadAdminWizardSchedule(weekId, (slots) => {
            adminAvailability = {};
            currentLoadedWeekId = weekId;
            Object.keys(slots).forEach(slotId => {
                const [dStr, tStr] = slotId.split('T');
                if (!adminAvailability[dStr]) adminAvailability[dStr] = {};
                
                if (slots[slotId].status === 'blocked') {
                    adminAvailability[dStr][tStr] = 'blocked';
                }
            });
            renderAdminWeek();
        });
    } else {
        renderAdminWeek();
    }
}

function renderAdminWeek() {
    const weekStart = new Date(adminCurrentDate);
    const weekEnd = new Date(adminCurrentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatLabel = (d) => `${d.getDate()} ${monthNames[d.getMonth()]}`;
    document.getElementById('admin-week-label').innerText = `${formatLabel(weekStart)} - ${formatLabel(weekEnd)} ${weekEnd.getFullYear()}`;
    
    const grid = document.getElementById('admin-calendar-days');
    grid.innerHTML = `
        <div class="day-name">Dom</div><div class="day-name">Seg</div><div class="day-name">Ter</div>
        <div class="day-name">Qua</div><div class="day-name">Qui</div><div class="day-name">Sex</div><div class="day-name">Sáb</div>
    `;
    
    for (let i = 0; i < 7; i++) {
        const loopDate = new Date(weekStart);
        loopDate.setDate(loopDate.getDate() + i);
        
        let classNames = 'calendar-day available';
        if (adminSelectedDay && loopDate.toDateString() === adminSelectedDay.toDateString()) {
            classNames += ' selected';
        }
        
        // Show if day has any slots configured
        const dateStr = loopDate.toISOString().split('T')[0];
        if (adminAvailability[dateStr] && Object.keys(adminAvailability[dateStr]).length > 0) {
            classNames += ' has-slots'; // Can be styled with a dot
        }

        const div = document.createElement('div');
        div.className = classNames;
        div.innerText = loopDate.getDate();
        div.onclick = () => selectAdminDay(loopDate);
        grid.appendChild(div);
    }
}

function selectAdminDay(date) {
    adminSelectedDay = new Date(date);
    renderAdminWeek();
    
    document.getElementById('admin-selected-day-label').innerText = `${date.getDate()} ${monthNames[date.getMonth()]}`;
    
    // Generate time slots from 06:00 to 20:00 every 30 mins
    const timeSlotsDiv = document.getElementById('admin-time-slots');
    timeSlotsDiv.innerHTML = '';
    
    const dateStr = date.toISOString().split('T')[0];
    if (!adminAvailability[dateStr]) adminAvailability[dateStr] = {};
    
    for (let h = 6; h <= 20; h++) {
        for (let m of ['00', '30']) {
            const time = `${h.toString().padStart(2,'0')}:${m}`;
            const div = document.createElement('div');
            
            // Check if this slot is blocked
            const isBlocked = adminAvailability[dateStr][time] === 'blocked';
            
            if (isBlocked) {
                div.className = `time-slot service-blocked selected`;
                div.style.backgroundColor = '#555';
                div.style.borderColor = '#555';
                div.style.color = '#fff';
                div.innerText = `${time} (Bloqueado)`;
            } else {
                div.className = `time-slot available`;
                div.innerText = time;
            }
            
            div.onclick = (e) => toggleAdminTime(dateStr, time, div);
            timeSlotsDiv.appendChild(div);
        }
    }
    
    document.getElementById('admin-time-slots-container').style.display = 'block';
}

function toggleAdminTime(dateStr, time, element) {
    if (!adminAvailability[dateStr]) {
        adminAvailability[dateStr] = {};
    }
    
    const isBlocked = adminAvailability[dateStr][time] === 'blocked';
    
    if (isBlocked) {
        // Unblock it
        delete adminAvailability[dateStr][time];
        element.className = `time-slot available`;
        element.style = '';
        element.innerText = time;
    } else {
        // Block it
        adminAvailability[dateStr][time] = 'blocked';
        element.className = `time-slot service-blocked selected`;
        element.style.backgroundColor = '#555';
        element.style.borderColor = '#555';
        element.style.color = '#fff';
        element.innerText = `${time} (Bloqueado)`;
    }
    
    // re-render week to show "has-slots" indicator if needed
    renderAdminWeek();
}

window.publishAdminWeek = function() {
    const pubBtn = document.getElementById('btn-publish-week');
    if (pubBtn) {
        pubBtn.disabled = true;
        pubBtn.innerHTML = "A publicar...";
    }
    
    // Construct slotsMap format
    const slotsMap = {};
    
    // We send all slots for Mon-Sat, 06:00-20:00
    // Monday is offset 1, Saturday is offset 6
    for (let i = 1; i <= 6; i++) {
        const loopDate = new Date(adminCurrentDate);
        loopDate.setDate(loopDate.getDate() + i);
        const dateStr = loopDate.toISOString().split('T')[0];
        
        for (let h = 6; h <= 20; h++) {
            for (let m of ['00', '30']) {
                const timeStr = `${h.toString().padStart(2,'0')}:${m}`;
                const slotId = `${dateStr}T${timeStr}`;
                
                const isBlocked = adminAvailability[dateStr] && adminAvailability[dateStr][timeStr] === 'blocked';
                
                if (isBlocked) {
                    slotsMap[slotId] = {
                        status: 'blocked'
                    };
                } else {
                    slotsMap[slotId] = {
                        status: 'available',
                        bookedBy: null,
                        bookedName: null,
                        serviceType: null
                    };
                }
            }
        }
    }
    
    const year = adminCurrentDate.getFullYear();
    const month = String(adminCurrentDate.getMonth() + 1).padStart(2, '0');
    const day = String(adminCurrentDate.getDate()).padStart(2, '0');
    const weekId = `${year}-${month}-${day}`;
    
    if (window.saveAdminWizardSchedule) {
        window.saveAdminWizardSchedule(slotsMap, weekId);
    } else {
        console.error("saveAdminWizardSchedule not found!");
        alert("Erro de conexão ao servidor.");
    }
};
window.clearAdminWeek = function() {
    if (confirm("Tem a certeza que deseja limpar as seleções da semana atual? (Isto não cancela as reservas dos clientes já feitas)")) {
        adminAvailability = {};
        if (adminSelectedDay) {
            selectAdminDay(adminSelectedDay);
        }
        renderAdminWeek();
    }
};
