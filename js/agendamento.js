// js/agendamento.js
// Logic for Step-by-Step Booking System (Wizard)

// ===== BOOKING TUTORIAL ONBOARDING SYSTEM =====
let tutorialCurrentSlide = 0;
const TUTORIAL_TOTAL_SLIDES = 7;
const TUTORIAL_STORAGE_KEY = 'pm_booking_tutorial_seen';

function initTutorialIndicators() {
    const container = document.getElementById('tutorial-indicators');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < TUTORIAL_TOTAL_SLIDES; i++) {
        const dot = document.createElement('div');
        dot.className = `tutorial-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToTutorialSlide(i);
        container.appendChild(dot);
    }
}

function updateTutorialIndicators() {
    const dots = document.querySelectorAll('.tutorial-dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === tutorialCurrentSlide) {
            dot.classList.add('active');
        } else if (i < tutorialCurrentSlide) {
            dot.classList.add('completed');
        }
    });
}

function updateTutorialNav() {
    const nav = document.getElementById('tutorial-nav');
    if (!nav) return;

    const isLast = tutorialCurrentSlide === TUTORIAL_TOTAL_SLIDES - 1;
    const isFirst = tutorialCurrentSlide === 0;

    let html = '';

    if (isFirst) {
        html += `<button class="tutorial-btn tutorial-btn-skip" onclick="closeTutorial()">Saltar</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-prev" onclick="prevTutorialSlide()"><i data-lucide="arrow-left"></i> Anterior</button>`;
    }

    if (isLast) {
        html += `<button class="tutorial-btn tutorial-btn-start" onclick="closeTutorial()">Começar a Reservar!</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-next" onclick="nextTutorialSlide()">Seguinte <i data-lucide="arrow-right"></i></button>`;
    }

    nav.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

function goToTutorialSlide(index) {
    if (index < 0 || index >= TUTORIAL_TOTAL_SLIDES || index === tutorialCurrentSlide) return;

    const slides = document.querySelectorAll('.tutorial-slide');
    const currentSlide = slides[tutorialCurrentSlide];
    const nextSlide = slides[index];

    // Determine direction
    const goingForward = index > tutorialCurrentSlide;

    // Exit current
    currentSlide.classList.remove('active');
    currentSlide.classList.add(goingForward ? 'exit-left' : '');
    currentSlide.style.transform = goingForward ? 'translateX(-60px)' : 'translateX(60px)';

    // Prepare next
    nextSlide.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
    nextSlide.style.opacity = '0';

    // Small delay for animation
    setTimeout(() => {
        currentSlide.classList.remove('exit-left');
        currentSlide.style.transform = '';
        currentSlide.style.opacity = '';

        nextSlide.classList.add('active');
        nextSlide.style.transform = '';
        nextSlide.style.opacity = '';
    }, 50);

    tutorialCurrentSlide = index;
    updateTutorialIndicators();
    updateTutorialNav();
}

function nextTutorialSlide() {
    goToTutorialSlide(tutorialCurrentSlide + 1);
}

function prevTutorialSlide() {
    goToTutorialSlide(tutorialCurrentSlide - 1);
}

function openTutorial() {
    tutorialCurrentSlide = 0;
    
    // Reset all slides
    const slides = document.querySelectorAll('.tutorial-slide');
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'exit-left');
        slide.style.transform = '';
        slide.style.opacity = '';
        if (i === 0) slide.classList.add('active');
    });

    initTutorialIndicators();
    updateTutorialNav();

    const overlay = document.getElementById('booking-tutorial-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    if (window.lucide) window.lucide.createIcons();
}

function closeTutorial() {
    const overlay = document.getElementById('booking-tutorial-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    // Mark tutorial as seen
    try {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {
        console.warn('Could not save tutorial state to localStorage:', e);
    }
}

// Called by auth.js when client clicks "Nova Marcação"
window.maybeShowBookingTutorial = function() {
    try {
        const seen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (!seen) {
            openTutorial();
            return true; // Tutorial was shown
        }
    } catch (e) {
        console.warn('Could not check tutorial state:', e);
    }
    return false; // Tutorial was NOT shown
};

// Expose globally for onclick handlers in HTML
window.closeTutorial = closeTutorial;
window.nextTutorialSlide = nextTutorialSlide;
window.prevTutorialSlide = prevTutorialSlide;
window.openTutorial = openTutorial;
// ===== END TUTORIAL SYSTEM =====

// ===== ADMIN TUTORIAL ONBOARDING SYSTEM =====
let adminTutorialCurrentSlide = 0;
const ADMIN_TUTORIAL_TOTAL_SLIDES = 8;
const ADMIN_TUTORIAL_STORAGE_KEY = 'pm_admin_tutorial_seen';

function initAdminTutorialIndicators() {
    const container = document.getElementById('admin-tutorial-indicators');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < ADMIN_TUTORIAL_TOTAL_SLIDES; i++) {
        const dot = document.createElement('div');
        dot.className = `tutorial-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToAdminTutorialSlide(i);
        container.appendChild(dot);
    }
}

function updateAdminTutorialIndicators() {
    const dots = document.querySelectorAll('#admin-tutorial-indicators .tutorial-dot');
    dots.forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i === adminTutorialCurrentSlide) {
            dot.classList.add('active');
        } else if (i < adminTutorialCurrentSlide) {
            dot.classList.add('completed');
        }
    });
}

function updateAdminTutorialNav() {
    const nav = document.getElementById('admin-tutorial-nav');
    if (!nav) return;

    const isLast = adminTutorialCurrentSlide === ADMIN_TUTORIAL_TOTAL_SLIDES - 1;
    const isFirst = adminTutorialCurrentSlide === 0;

    let html = '';

    if (isFirst) {
        html += `<button class="tutorial-btn tutorial-btn-skip" onclick="closeAdminTutorial()">Saltar</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-prev" onclick="prevAdminTutorialSlide()"><i data-lucide="arrow-left"></i> Anterior</button>`;
    }

    if (isLast) {
        html += `<button class="tutorial-btn tutorial-btn-start" onclick="closeAdminTutorial()">Entendido!</button>`;
    } else {
        html += `<button class="tutorial-btn tutorial-btn-next" onclick="nextAdminTutorialSlide()">Seguinte <i data-lucide="arrow-right"></i></button>`;
    }

    nav.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
}

function goToAdminTutorialSlide(index) {
    if (index < 0 || index >= ADMIN_TUTORIAL_TOTAL_SLIDES || index === adminTutorialCurrentSlide) return;

    const slides = document.querySelectorAll('.admin-tutorial-slide');
    const currentSlide = slides[adminTutorialCurrentSlide];
    const nextSlide = slides[index];

    const goingForward = index > adminTutorialCurrentSlide;

    currentSlide.classList.remove('active');
    currentSlide.classList.add(goingForward ? 'exit-left' : '');
    currentSlide.style.transform = goingForward ? 'translateX(-60px)' : 'translateX(60px)';

    nextSlide.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
    nextSlide.style.opacity = '0';

    setTimeout(() => {
        currentSlide.classList.remove('exit-left');
        currentSlide.style.transform = '';
        currentSlide.style.opacity = '';

        nextSlide.classList.add('active');
        nextSlide.style.transform = '';
        nextSlide.style.opacity = '';
    }, 50);

    adminTutorialCurrentSlide = index;
    updateAdminTutorialIndicators();
    updateAdminTutorialNav();
}

function nextAdminTutorialSlide() {
    goToAdminTutorialSlide(adminTutorialCurrentSlide + 1);
}

function prevAdminTutorialSlide() {
    goToAdminTutorialSlide(adminTutorialCurrentSlide - 1);
}

function openAdminTutorial() {
    adminTutorialCurrentSlide = 0;

    const slides = document.querySelectorAll('.admin-tutorial-slide');
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'exit-left');
        slide.style.transform = '';
        slide.style.opacity = '';
        if (i === 0) slide.classList.add('active');
    });

    initAdminTutorialIndicators();
    updateAdminTutorialNav();

    const overlay = document.getElementById('admin-tutorial-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    if (window.lucide) window.lucide.createIcons();
}

function closeAdminTutorial() {
    const overlay = document.getElementById('admin-tutorial-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    try {
        localStorage.setItem(ADMIN_TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {
        console.warn('Could not save admin tutorial state to localStorage:', e);
    }
}

// Called by auth.js when admin clicks "Gestão da Agenda"
window.maybeShowAdminTutorial = function() {
    try {
        const seen = localStorage.getItem(ADMIN_TUTORIAL_STORAGE_KEY);
        if (!seen) {
            openAdminTutorial();
            return true;
        }
    } catch (e) {
        console.warn('Could not check admin tutorial state:', e);
    }
    return false;
};

// Role-aware tutorial opener (for the dashboard help icon)
function openRoleTutorial() {
    const isAdmin = document.getElementById('btn-show-profiles') && !document.getElementById('btn-show-profiles').classList.contains('hidden');
    if (isAdmin) {
        openAdminTutorial();
    } else {
        openTutorial();
    }
}

// Expose globally
window.closeAdminTutorial = closeAdminTutorial;
window.nextAdminTutorialSlide = nextAdminTutorialSlide;
window.prevAdminTutorialSlide = prevAdminTutorialSlide;
window.openAdminTutorial = openAdminTutorial;
window.openRoleTutorial = openRoleTutorial;
// ===== END ADMIN TUTORIAL SYSTEM =====

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
        { id: 'tr_presencial', name: 'Personalizado Presencial', icon: 'user', desc: 'Treino individual 1 para 1 (60 min)' },
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
        window.loadAdminWizardSchedule(weekId, (loadedSlots, isPublished) => {
            renderClientTimeSlots(loadedSlots, isoDateStr, isPublished);
        });
    } else {
        timeSlotsDiv.innerHTML = '<p class="color-text-dim text-center">Erro ao carregar horários.</p>';
    }
}

function renderClientTimeSlots(loadedSlots, isoDateStr, isPublished) {
    const timeSlotsDiv = document.getElementById('time-slots');
    timeSlotsDiv.innerHTML = '';
    
    if (isPublished !== true) {
        timeSlotsDiv.innerHTML = '<p class="color-text-dim text-center">A agenda para esta semana ainda não foi publicada. Estará disponível no Domingo.</p>';
        return;
    }
    
    let serviceClass = '';
    let durationSlots = 1; // 1 slot = 30min
    
    if (bookingData.category === 'osteopatia') {
        serviceClass = 'service-osteopatia';
        durationSlots = 2; // 60 mins
    } else {
        if (bookingData.modality === 'tr_presencial') {
            serviceClass = 'service-treino_personalizado';
            durationSlots = 2; // 60 mins
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
            div.className = `time-slot ${serviceClass} ${isSelected ? 'active-selection' : ''}`;
            
            if (isOnlineGroup) {
                div.innerHTML = `${time}<br><small>${onlineCount} inscrito(s)</small>`;
            } else {
                div.innerText = time;
            }
            
            div.onclick = (e) => selectTime(time, div, isoDateStr, bookingData.date);
            timeSlotsDiv.appendChild(div);
        } else {
            hasAvailableSlots = true;
            const time = baseSlots[i];
            const div = document.createElement('div');
            div.className = 'time-slot empty';
            div.style.pointerEvents = 'none';
            div.innerHTML = `${time}<br><span class="indisponivel-text">Indisponível</span>`;
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
        element.classList.remove('active-selection');
    } else {
        // Select
        bookingData.selections.push({ isoDate: isoDateStr, dateStr, time });
        element.classList.add('active-selection');
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
    if (payload.modality === 'tr_presencial') durationSlots = 2;
    
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
let adminAvailability = {}; // e.g. { "YYYY-MM-DD": { "09:00": "blocked" } }
let publishedAvailability = {}; // Tracks what is currently in Firestore
let adminWeekIsPublished = false; // Tracks if the current week is published

window.openAdminBookingWizard = function() {
    // Força a agenda a abrir sempre na semana atual
    adminCurrentDate = new Date();
    let dayOfWeek = adminCurrentDate.getDay();
    adminCurrentDate.setDate(adminCurrentDate.getDate() - dayOfWeek);
    adminSelectedDay = null;
    
    const timeSlotsContainer = document.getElementById('admin-time-slots-container');
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';

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
    const btnBlockAll = document.getElementById('btn-block-all-day');
    const btnClearBlocks = document.getElementById('btn-clear-blocks');
    const btnPublish = document.getElementById('btn-publish-week');
    if (btnPublish) btnPublish.style.display = 'none';
    if (btnBlockAll) btnBlockAll.style.display = 'none';
    if (btnClearBlocks) btnClearBlocks.style.display = 'none';
    fetchAdminScheduleAndRender();
};

function syncPublishButton() {
    const btnPublish = document.getElementById('btn-publish-week');
    if (!btnPublish) return;

    let isDirty = false;
    
    // Check if anything in adminAvailability is NOT in publishedAvailability
    for (const d in adminAvailability) {
        for (const t in adminAvailability[d]) {
            if (adminAvailability[d][t] === 'blocked' && (!publishedAvailability[d] || publishedAvailability[d][t] !== 'blocked')) {
                isDirty = true;
                break;
            }
        }
        if (isDirty) break;
    }
    
    // Check if anything in publishedAvailability was REMOVED from adminAvailability
    if (!isDirty) {
        for (const d in publishedAvailability) {
            for (const t in publishedAvailability[d]) {
                if (publishedAvailability[d][t] === 'blocked' && (!adminAvailability[d] || adminAvailability[d][t] !== 'blocked')) {
                    isDirty = true;
                    break;
                }
            }
            if (isDirty) break;
        }
    }
    
    if (!adminWeekIsPublished) {
        isDirty = true; // Always allow publishing an unpublished week
        btnPublish.style.backgroundColor = '#e74c3c';
        btnPublish.style.borderColor = '#e74c3c';
        btnPublish.innerHTML = '<i data-lucide="upload-cloud"></i> Publicar Agenda da Semana';
    } else {
        btnPublish.style.backgroundColor = ''; // Reset to default
        btnPublish.style.borderColor = '';
        btnPublish.innerHTML = '<i data-lucide="upload-cloud"></i> Atualizar Agenda';
    }
    
    btnPublish.style.display = isDirty ? 'inline-flex' : 'none';
    
    const btnResend = document.getElementById('btn-resend-broadcast');
    if (btnResend) {
        btnResend.style.display = adminWeekIsPublished ? 'inline-flex' : 'none';
    }
    
    if (window.lucide) window.lucide.createIcons();
}

let currentLoadedWeekId = null;

function fetchAdminScheduleAndRender() {
    const year = adminCurrentDate.getFullYear();
    const month = String(adminCurrentDate.getMonth() + 1).padStart(2, '0');
    const day = String(adminCurrentDate.getDate()).padStart(2, '0');
    const weekId = `${year}-${month}-${day}`;
    
    // Only fetch if we haven't loaded this week yet, to prevent wiping unsaved changes when changing the service dropdown
    if (window.loadAdminWizardSchedule && currentLoadedWeekId !== weekId) {
        window.loadAdminWizardSchedule(weekId, (slots, isPublished) => {
            adminAvailability = {};
            publishedAvailability = {};
            currentLoadedWeekId = weekId;
            adminWeekIsPublished = isPublished;
            Object.keys(slots).forEach(slotId => {
                const [dStr, tStr] = slotId.split('T');
                if (!adminAvailability[dStr]) adminAvailability[dStr] = {};
                if (!publishedAvailability[dStr]) publishedAvailability[dStr] = {};
                
                if (slots[slotId].status === 'blocked') {
                    adminAvailability[dStr][tStr] = 'blocked';
                    publishedAvailability[dStr][tStr] = 'blocked';
                }
            });
            renderAdminWeek();
            syncPublishButton();
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
            const isPublished = publishedAvailability[dateStr] && publishedAvailability[dateStr][time] === 'blocked';
            
            if (isBlocked) {
                div.className = `time-slot admin-selectable service-blocked active`;
                div.style.backgroundColor = isPublished ? '#555' : 'var(--color-primary)';
                div.style.borderColor = isPublished ? '#555' : 'var(--color-primary)';
                div.style.color = '#fff';
                div.innerHTML = `${time}<br><small style="font-size:0.7em;">${isPublished ? '(Bloqueado)' : 'Por Bloquear'}</small>`;
            } else {
                div.className = `time-slot available`;
                div.innerText = time;
            }
            
            div.onclick = (e) => toggleAdminTime(dateStr, time, div);
            timeSlotsDiv.appendChild(div);
        }
    }
    
    document.getElementById('admin-time-slots-container').style.display = 'block';
    
    // Check if there are any PUBLISHED blocks for this day to show the clear button
    let hasPublishedBlocks = false;
    if (publishedAvailability[dateStr]) {
        for (const t in publishedAvailability[dateStr]) {
            if (publishedAvailability[dateStr][t] === 'blocked') {
                hasPublishedBlocks = true;
                break;
            }
        }
    }
    
    // Check state of the day to show/hide buttons
    let blockedCount = 0;
    let totalSlots = 0;
    for (let h = 6; h <= 20; h++) {
        for (let m of ['00', '30']) {
            totalSlots++;
            const t = `${h.toString().padStart(2,'0')}:${m}`;
            if (adminAvailability[dateStr] && adminAvailability[dateStr][t] === 'blocked') {
                blockedCount++;
            }
        }
    }
    
    const btnBlockAll = document.getElementById('btn-block-all-day');
    const btnClearBlocks = document.getElementById('btn-clear-blocks');
    
    if (btnBlockAll) btnBlockAll.style.display = (blockedCount < totalSlots) ? 'inline-flex' : 'none';
    if (btnClearBlocks) btnClearBlocks.style.display = hasPublishedBlocks ? 'inline-flex' : 'none';
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
        const isPublished = publishedAvailability[dateStr] && publishedAvailability[dateStr][time] === 'blocked';
        element.className = `time-slot admin-selectable service-blocked active`;
        element.style.backgroundColor = isPublished ? '#555' : 'var(--color-primary)';
        element.style.borderColor = isPublished ? '#555' : 'var(--color-primary)';
        element.style.color = '#fff';
        element.innerHTML = `${time}<br><small style="font-size:0.7em;">${isPublished ? '(Bloqueado)' : 'Por Bloquear'}</small>`;
    }
    
    // re-render week to show "has-slots" indicator if needed
    renderAdminWeek();
    syncPublishButton();
    
    // Update button visibility
    const btnBlockAll = document.getElementById('btn-block-all-day');
    const btnClearBlocks = document.getElementById('btn-clear-blocks');
    
    let blockedCount = 0;
    let totalSlots = 0;
    let hasPublishedBlocks = false;
    
    for (let h = 6; h <= 20; h++) {
        for (let m of ['00', '30']) {
            totalSlots++;
            const t = `${h.toString().padStart(2,'0')}:${m}`;
            if (adminAvailability[dateStr] && adminAvailability[dateStr][t] === 'blocked') {
                blockedCount++;
            }
        }
    }
    
    if (publishedAvailability[dateStr]) {
        for (const t in publishedAvailability[dateStr]) {
            if (publishedAvailability[dateStr][t] === 'blocked') {
                hasPublishedBlocks = true;
                break;
            }
        }
    }
    
    if (btnBlockAll) btnBlockAll.style.display = (blockedCount < totalSlots) ? 'inline-flex' : 'none';
    if (btnClearBlocks) btnClearBlocks.style.display = hasPublishedBlocks ? 'inline-flex' : 'none';
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
window.clearAdminDay = function() {
    if (!adminSelectedDay) return;
    if (confirm("Tem a certeza que deseja limpar os bloqueios deste dia?")) {
        const dateStr = adminSelectedDay.toISOString().split('T')[0];
        if (adminAvailability[dateStr]) {
            adminAvailability[dateStr] = {};
        }
        selectAdminDay(adminSelectedDay);
        syncPublishButton();
    }
};

window.blockAllDay = function() {
    if (!adminSelectedDay) return;
    const dateStr = adminSelectedDay.toISOString().split('T')[0];
    if (!adminAvailability[dateStr]) adminAvailability[dateStr] = {};
    
    for (let h = 6; h <= 20; h++) {
        for (let m of ['00', '30']) {
            const timeStr = `${h.toString().padStart(2,'0')}:${m}`;
            adminAvailability[dateStr][timeStr] = 'blocked';
        }
    }
    
    selectAdminDay(adminSelectedDay);
    syncPublishButton();
};
