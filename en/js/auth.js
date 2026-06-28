/*
 * Developed by Elysium λ Development & Research
 * A European company
 */
// Import the functions you need from the SDKs you need
import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initCalendarMode } from './calendar.js';

// UI Elements & State Management
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the profile page
    if (!document.querySelector('.auth-card-container')) return;

    // Remove auto-focus from any field on load (prevents browser auto-selection)
    setTimeout(() => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            document.activeElement.blur();
        }
    }, 500); // 500ms delay to ensure browser finishes its "auto-focus" logic

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authCard = document.getElementById('auth-card');
    const userDashboard = document.getElementById('user-dashboard');

    // Toggle between Login and Register tabs
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            switchTab('login');
        });

        tabRegister.addEventListener('click', () => {
            switchTab('register');
        });
    }

    function switchTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    // Monitor Auth State
    onAuthStateChanged(auth, async (user) => {
        if (window.isReactivating) return;
        if (user) {
            try {
                const checkSnap = await getDoc(doc(db, "users", user.uid));
                if (checkSnap.exists() && checkSnap.data().isDeactivated) {
                    await signOut(auth);
                    alert("Your account is deactivated. To reactivate it, please register again using the same details.");
                    return;
                }
            } catch(e) {
                console.warn("Could not check deactivated status", e);
            }

            // User is signed in
            localStorage.setItem('pm_is_logged_in', 'true');
            if (window.injectPwaInstallButton) window.injectPwaInstallButton();
            if (window.maybeAutoShowPwaTutorial) window.maybeAutoShowPwaTutorial();
            
            console.log('User signed in:', user.email);
            authCard.classList.add('hidden');
            userDashboard.classList.remove('hidden');

            const ADMIN_EMAIL = "pt@pmorais.pt";
            const userEmail = user.email ? user.email.toLowerCase().trim() : "no-email";
            console.log("Auth State Changed. User:", userEmail);
            const isAdminEmail = userEmail === ADMIN_EMAIL.toLowerCase();

            const btnShowProfiles = document.getElementById('btn-show-profiles');
            const btnShowForms = document.getElementById('btn-show-forms');
            const btnStartBooking = document.getElementById('btn-start-booking');
            
            console.log("Immediate Admin Check:", { userEmail, isAdminEmail });

            if (isAdminEmail) {
                console.log("Admin detected by email (Immediate)");
                if (btnShowProfiles) {
                    btnShowProfiles.classList.remove('hidden');
                    btnShowProfiles.onclick = () => window.location.href = 'perfis.html';
                }
                if (btnShowForms) {
                    btnShowForms.classList.remove('hidden');
                    btnShowForms.onclick = () => window.location.href = 'formulario.html';
                }
                if (btnStartBooking) {
                    const span = btnStartBooking.querySelector('.btn-text');
                    if (span) span.textContent = 'Gestão de Agenda';
                    else btnStartBooking.textContent = 'Gestão de Agenda';
                }
            }



            // Show dashboard IMMEDIATELY - don't wait for async data
            authCard.classList.add('hidden');
            userDashboard.classList.remove('hidden');
            const dashboardActionsImmediate = document.getElementById('dashboard-main-actions');
            if (dashboardActionsImmediate) dashboardActionsImmediate.classList.remove('hidden');
            console.log('Dashboard shown immediately for:', user.email);

            // For admin: also show preview section immediately so it's visible
            // even if the async loadUserProfile fails or takes too long
            if (isAdminEmail) {
                const previewSectionImmediate = document.getElementById('dashboard-preview-section');
                if (previewSectionImmediate) {
                    previewSectionImmediate.classList.remove('hidden');
                    console.log('Admin preview section shown immediately');
                }
            }

            // Load user data and wait for it to get the role
            const userData = await loadUserProfile(user);
            console.log("User data loaded for:", user.email, userData);

            const isCompleted = !!userData?.profileCompleted;

            // Check for booking parameter and auto-trigger wizard for clients
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('booking') === 'true') {
                if (!isAdminEmail && btnStartBooking) {
                    if (isCompleted) {
                        setTimeout(() => {
                            btnStartBooking.click();
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                        }, 500);
                    } else {
                        sessionStorage.setItem('pendingBooking', 'true');
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                }
            }

            // Initialize Calendar System depending on Role and Profile Completion
            console.log("Initializing calendar. Profile completed:", isCompleted);
            initCalendarMode(user, db, userData?.role, isCompleted);
        } else {
            // User is signed out
            localStorage.setItem('pm_is_logged_in', 'false');
            const pwaBtn = document.getElementById('pwa-install-btn');
            if (pwaBtn) pwaBtn.remove();
            
            console.log('User signed out');
            authCard.classList.remove('hidden');
            userDashboard.classList.add('hidden');
            // Reset wizard state
            const profileWizard = document.getElementById('profile-wizard');
            const dashboardActions = document.getElementById('dashboard-main-actions');
            if (profileWizard) profileWizard.classList.add('hidden');
            if (dashboardActions) dashboardActions.classList.remove('hidden');
        }
    });

    // Login Event
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert("Please fill in both email and password.");
                return;
            }

            try {
                const loginBtn = document.getElementById('btn-login');
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.textContent = "Logging in...";
                }
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                console.error("Login error:", error);
                alert("Error logging in: " + translateError(error.code));
                const loginBtn = document.getElementById('btn-login');
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = "Log In";
                }
            }
        });
    }

    // Register Event
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            if (!name || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            try {
                const registerBtn = document.getElementById('btn-register');
                if (registerBtn) {
                    registerBtn.disabled = true;
                    registerBtn.textContent = "Creating account...";
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save additional user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    role: "client",
                    profileCompleted: false,
                    isDeactivated: false,
                    createdAt: new Date().toISOString()
                });

                console.log("User registered and data saved");
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    try {
                        window.isReactivating = true;
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        const checkUser = userCredential.user;
                        const docRef = doc(db, "users", checkUser.uid);
                        const docSnap = await getDoc(docRef);
                        
                        if (docSnap.exists() && docSnap.data().isDeactivated) {
                            await updateDoc(docRef, { isDeactivated: false });
                            alert("Your account has been successfully reactivated! Welcome back.");
                            window.location.reload();
                            return;
                        } else {
                            await signOut(auth);
                            window.isReactivating = false;
                            alert("This email is already registered and active. Please log in on the 'Log In' tab.");
                        }
                    } catch (loginErr) {
                        window.isReactivating = false;
                        alert("This email is already registered. If it's yours, log in or recover your password.");
                    }
                } else {
                    console.error("Registration error:", error);
                    alert("Error registering: " + translateError(error.code));
                }
                const registerBtn = document.getElementById('btn-register');
                if (registerBtn) {
                    registerBtn.disabled = false;
                    registerBtn.textContent = "Create Account";
                }
            }
        });
    }

    // Forgot Password
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            if (!email) {
                alert("Please enter your email in the log in field first.");
                return;
            }

            try {
                const actionCodeSettings = {
                    url: 'https://pmorais.pt/auth-action',
                    handleCodeInApp: false
                };
                await sendPasswordResetEmail(auth, email, actionCodeSettings);
                alert("Recovery email sent! Check your inbox.");
            } catch (error) {
                console.error("Reset password error:", error);
                alert("Error sending email: " + translateError(error.code));
            }
        });
    }

    // Logout Event
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }

    // Profile Wizard Logic
    const btnShowWizard = document.getElementById('btn-show-wizard');
    const btnCancelWizard = document.getElementById('btn-cancel-wizard');
    const profileWizard = document.getElementById('profile-wizard');
    const dashboardActions = document.getElementById('dashboard-main-actions');
    const dashboardPreviewSection = document.getElementById('dashboard-preview-section');
    const profileForm = document.getElementById('profile-form');

    if (btnShowWizard) {
        btnShowWizard.addEventListener('click', () => {
            profileWizard.classList.remove('hidden');
            dashboardActions.classList.add('hidden');
            
            const tutorialCheckbox = document.getElementById('prof-tutorial-seen');
            if (tutorialCheckbox) {
                const clientSeen = localStorage.getItem('pm_booking_tutorial_seen') === 'true';
                const adminSeen = localStorage.getItem('pm_admin_tutorial_seen') === 'true';
                tutorialCheckbox.checked = clientSeen || adminSeen;
            }

            const pwaTutorialCheckbox = document.getElementById('pwa-tutorial-seen');
            if (pwaTutorialCheckbox) {
                pwaTutorialCheckbox.checked = localStorage.getItem('pm_pwa_tutorial_dismissed') === 'true';
            }

            // Scroll to the wizard
            setTimeout(() => {
                profileWizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    }

    if (btnCancelWizard) {
        btnCancelWizard.addEventListener('click', () => {
            profileWizard.classList.add('hidden');
            dashboardActions.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const btnDeactivateAccount = document.getElementById('btn-deactivate-account');
    if (btnDeactivateAccount) {
        btnDeactivateAccount.addEventListener('click', async () => {
            const confirmDeactivation = confirm("Are you sure you want to deactivate your account? You will not be able to log in again until you register a new account.");
            if (confirmDeactivation) {
                const user = auth.currentUser;
                if (user) {
                    try {
                        await updateDoc(doc(db, "users", user.uid), {
                            isDeactivated: true
                        });
                        alert("Account successfully deactivated.");
                        await signOut(auth);
                        window.location.reload();
                    } catch (error) {
                        console.error("Error deactivating account:", error);
                        alert("An error occurred while deactivating your account.");
                    }
                }
            }
        });
    }

    // Booking Wizard / Admin Manager Logic
    const btnStartBooking = document.getElementById('btn-start-booking');
    const bookingWizardSection = document.getElementById('booking-wizard-section');
    // (dashboardActions and dashboardPreviewSection already declared above)
    
    if (btnStartBooking) {
        btnStartBooking.addEventListener('click', () => {
            // Determine if admin by checking button
            const isAdmin = document.getElementById('btn-show-profiles') && !document.getElementById('btn-show-profiles').classList.contains('hidden');
            const targetSection = isAdmin ? document.getElementById('admin-calendar-section') : document.getElementById('booking-wizard-section');
            
            if (targetSection) targetSection.classList.remove('hidden');
            if (dashboardActions) dashboardActions.classList.add('hidden');
            if (dashboardPreviewSection) dashboardPreviewSection.classList.add('hidden');
            
            if (!isAdmin && window.goToStep) window.goToStep(1); // Reset wizard
            if (isAdmin && window.openAdminBookingWizard) window.openAdminBookingWizard();
            
            // Show tutorial for first-time client bookings
            if (!isAdmin && window.maybeShowBookingTutorial) {
                window.maybeShowBookingTutorial();
            }
            
            // Show tutorial for first-time admin agenda management
            if (isAdmin && window.maybeShowAdminTutorial) {
                window.maybeShowAdminTutorial();
            }
            
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    }

    // Global function to close booking wizard
    window.closeBookingWizard = function() {
        // Refresh the page to ensure the dashboard data is updated
        location.reload();
    };

    if (profileForm) {
        // Handle conditional validation for Observations
        const healthIssuesSelect = document.getElementById('prof-health-issues');
        const physicalLimitsSelect = document.getElementById('prof-physical-limits');
        const birthdateInput = document.getElementById('prof-birthdate');
        const ageDisplay = document.getElementById('prof-age-display');
        const obsHint = document.getElementById('obs-hint');
        const obsLabel = document.getElementById('label-obs');

        const calculateAge = (birthday) => {
            const ageDifMs = Date.now() - new Date(birthday).getTime();
            const ageDate = new Date(ageDifMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        };

        if (birthdateInput) {
            birthdateInput.addEventListener('change', () => {
                if (birthdateInput.value) {
                    const age = calculateAge(birthdateInput.value);
                    ageDisplay.textContent = `(${age} anos)`;
                } else {
                    ageDisplay.textContent = "";
                }
            });
        }

        const phoneInput = document.getElementById('prof-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value;
                if (!value.startsWith('+')) {
                    e.target.value = '+351 ' + value.replace(/^\D+/g, '');
                }
            });
        }

        const updateObsState = () => {
            const hasIssues = healthIssuesSelect.value === 'sim' || physicalLimitsSelect.value === 'sim';
            if (hasIssues) {
                obsLabel.textContent = "Notes *";
                obsHint.classList.remove('hidden');
            } else {
                obsLabel.textContent = "Observações";
                obsHint.classList.add('hidden');
            }
        };

        if (healthIssuesSelect) healthIssuesSelect.addEventListener('change', updateObsState);
        if (physicalLimitsSelect) physicalLimitsSelect.addEventListener('change', updateObsState);

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const birthdate = birthdateInput.value;
            const age = birthdate ? calculateAge(birthdate) : null;
            const phone = document.getElementById('prof-phone').value;
            const weight = document.getElementById('prof-weight').value;
            const height = document.getElementById('prof-height').value;
            const fatMass = document.getElementById('prof-fat').value;
            const muscleMass = document.getElementById('prof-muscle').value;
            const healthIssues = healthIssuesSelect.value;
            const physicalLimits = physicalLimitsSelect.value;
            const observations = document.getElementById('prof-obs').value;

            // Mandatory Validation
            if (!birthdate || !weight || !height || !healthIssues || !physicalLimits) {
                alert("Please fill in all mandatory fields (*)");
                return;
            }

            // Conditional Validation for Observations
            if ((healthIssues === 'sim' || physicalLimits === 'sim') && !observations.trim()) {
                alert("Please describe your health issues or physical limitations in the Observations field.");
                document.getElementById('prof-obs').focus();
                return;
            }

            const tutorialCheckbox = document.getElementById('prof-tutorial-seen');
            if (tutorialCheckbox) {
                if (tutorialCheckbox.checked) {
                    localStorage.setItem('pm_booking_tutorial_seen', 'true');
                    localStorage.setItem('pm_admin_tutorial_seen', 'true');
                } else {
                    localStorage.removeItem('pm_booking_tutorial_seen');
                    localStorage.removeItem('pm_admin_tutorial_seen');
                }
            }

            const pwaTutorialCheckbox = document.getElementById('pwa-tutorial-seen');
            if (pwaTutorialCheckbox) {
                if (pwaTutorialCheckbox.checked) {
                    localStorage.setItem('pm_pwa_tutorial_dismissed', 'true');
                } else {
                    localStorage.removeItem('pm_pwa_tutorial_dismissed');
                }
            }

            try {
                await setDoc(doc(db, "users", user.uid), {
                    birthdate,
                    age,
                    phone,
                    weight,
                    height,
                    fatMass,
                    muscleMass,
                    healthIssues,
                    physicalLimits,
                    observations,
                    profileCompleted: true,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                alert("Profile updated successfully!");
                const updatedData = await loadUserProfile(user);
                // Refresh calendar state
                initCalendarMode(user, db, updatedData?.role, updatedData?.profileCompleted);
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (sessionStorage.getItem('pendingBooking') === 'true') {
                    sessionStorage.removeItem('pendingBooking');
                    const btnStartBooking = document.getElementById('btn-start-booking');
                    if (btnStartBooking) {
                        setTimeout(() => {
                            btnStartBooking.click();
                        }, 500);
                    }
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Error updating profile.");
            }
        });

        // Initialize tutorial checkbox on load
        const tutorialCheckbox = document.getElementById('prof-tutorial-seen');
        if (tutorialCheckbox) {
            const clientSeen = localStorage.getItem('pm_booking_tutorial_seen') === 'true';
            const adminSeen = localStorage.getItem('pm_admin_tutorial_seen') === 'true';
            // Mark checked if EITHER one is seen (handles both roles intuitively)
            tutorialCheckbox.checked = clientSeen || adminSeen;
        }

        const pwaTutorialCheckbox = document.getElementById('pwa-tutorial-seen');
        if (pwaTutorialCheckbox) {
            pwaTutorialCheckbox.checked = localStorage.getItem('pm_pwa_tutorial_dismissed') === 'true';
        }
    }
});

async function loadUserProfile(user) {
    const userWelcome = document.getElementById('user-welcome');
    
    // Form fields - fetch them inside to ensure they are current
    const profName = document.getElementById('prof-name');
    const profEmail = document.getElementById('prof-email');
    const profBirthdate = document.getElementById('prof-birthdate');
    const profAgeDisplay = document.getElementById('prof-age-display');
    const profPhone = document.getElementById('prof-phone');
    const profWeight = document.getElementById('prof-weight');
    const profHeight = document.getElementById('prof-height');
    const profFat = document.getElementById('prof-fat');
    const profMuscle = document.getElementById('prof-muscle');
    const profHealth = document.getElementById('prof-health-issues');
    const profPhysical = document.getElementById('prof-physical-limits');
    const profObs = document.getElementById('prof-obs');
    const obsLabel = document.getElementById('label-obs');
    const obsHint = document.getElementById('obs-hint');

    const calculateAge = (birthday) => {
        const ageDifMs = Date.now() - new Date(birthday).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Preliminary population from Auth object (faster)
    if (profEmail) profEmail.value = user.email || "";
    if (profName && user.displayName) profName.value = user.displayName;

    if (userWelcome) {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                userWelcome.textContent = `Hello, ${data.name || user.displayName || user.email}!`;

                // Populate Fields from Firestore (Source of truth)
                if (profName) profName.value = data.name || user.displayName || "";
                if (profEmail) profEmail.value = data.email || user.email || "";
                
                if (profBirthdate && data.birthdate) {
                    profBirthdate.value = data.birthdate;
                    // Update age display
                    if (profAgeDisplay) {
                        const age = calculateAge(data.birthdate);
                        profAgeDisplay.textContent = `(${age} anos)`;
                    }
                    // If profile is already completed, lock the birthdate
                    if (data.profileCompleted) {
                        profBirthdate.readOnly = true;
                    }
                }
                
                if (profPhone && data.phone) profPhone.value = data.phone;
                if (profWeight && data.weight) profWeight.value = data.weight;
                if (profHeight && data.height) profHeight.value = data.height;
                if (profFat && data.fatMass) profFat.value = data.fatMass;
                if (profMuscle && data.muscleMass) profMuscle.value = data.muscleMass;
                if (profHealth && data.healthIssues) profHealth.value = data.healthIssues;
                if (profPhysical && data.physicalLimits) profPhysical.value = data.physicalLimits;
                if (profObs && data.observations) profObs.value = data.observations;

                // Update observation hint after loading
                if (obsLabel && obsHint) {
                    const hasIssues = data.healthIssues === 'sim' || data.physicalLimits === 'sim';
                    if (hasIssues) {
                        obsLabel.textContent = "Notes *";
                        obsHint.classList.remove('hidden');
                    }
                }

                const calendarSection = document.getElementById('calendar-section');
                const adminCalendarSection = document.getElementById('admin-calendar-section');
                const dashboardActions = document.getElementById('dashboard-main-actions');
                const profileWizard = document.getElementById('profile-wizard');
                const cancelWizardBtn = document.getElementById('btn-cancel-wizard');

                const btnShowProfiles = document.getElementById('btn-show-profiles');
                const btnShowForms = document.getElementById('btn-show-forms');
                const userEmail = user.email ? user.email.toLowerCase().trim() : "no-email";
                const isAdminEmail = userEmail === "pt@pmorais.pt";
                const isAdmin = (data && data.role && data.role.toLowerCase() === 'admin') || isAdminEmail;

                console.log("CRITICAL ADMIN CHECK", { 
                    rawEmail: user.email,
                    processedEmail: "[" + userEmail + "]", 
                    isAdminEmail, 
                    isAdmin,
                    firestoreRole: data?.role 
                });

                if (isAdmin) {
                    // AUTO-FIX: Ensure Paulo has the admin role in Firestore if he's the owner
                    if (data.role !== 'admin' && isAdminEmail) {
                        // Non-blocking auto-fix
                        setDoc(doc(db, "users", user.uid), { role: 'admin' }, { merge: true })
                            .then(() => console.log("Admin role auto-fixed for Paulo in Firestore."))
                            .catch(e => console.warn("Could not auto-fix admin role. Possibly rules restricted.", e));
                    }

                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.add('hidden'); // HIDDEN by default now, shown via button
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                    if (btnShowProfiles) {
                        btnShowProfiles.classList.remove('hidden');
                        btnShowProfiles.onclick = () => window.location.href = 'perfis.html';
                    }
                    if (btnShowForms) {
                        btnShowForms.classList.remove('hidden');
                        btnShowForms.onclick = () => window.location.href = 'formulario.html';
                    }
                    
                    const btnStartBooking = document.getElementById('btn-start-booking');
                    if (btnStartBooking) btnStartBooking.innerHTML = '<i data-lucide="calendar"></i> <span class="btn-text">Agenda Management</span>';
                    
                    // Robust admin dashboard preview — catch errors so section stays visible
                    try {
                        await loadDashboardPreview(true, user, data);
                    } catch (previewError) {
                        console.error("Error loading admin dashboard preview:", previewError);
                        const fallbackList = document.getElementById('preview-list');
                        const fallbackSection = document.getElementById('dashboard-preview-section');
                        if (fallbackSection) fallbackSection.classList.remove('hidden');
                        if (fallbackList) fallbackList.innerHTML = '<p class="color-text-dim text-center" style="padding: 20px; margin: 0;">Error loading agenda data. Try reloading the page.</p>';
                    }
                    
                } else if (data.profileCompleted) {
                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.remove('hidden');
                    
                    loadDashboardPreview(false, user, data);
                } else {
                    // Profile NOT completed and is client
                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.add('hidden');
                    if (profileWizard) profileWizard.classList.remove('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.add('hidden'); // Hide cancel if mandatory
                    
                    const previewSection = document.getElementById('dashboard-preview-section');
                    if (previewSection) previewSection.classList.add('hidden');
                }

                // If profile is already completed, change button text
                const btnShowWizard = document.getElementById('btn-show-wizard');
                if (data.profileCompleted && btnShowWizard) {
                    const wizardText = btnShowWizard.querySelector('.btn-text');
                    if (wizardText) {
                        wizardText.textContent = 'Edit Profile';
                    } else {
                        btnShowWizard.textContent = 'Edit Profile';
                    }
                }
                return data;
            } else {
                console.log("No user document found. Checking if admin...");
                const ADMIN_EMAIL_CHECK = "pt@pmorais.pt";
                const userEmailLower = user.email ? user.email.toLowerCase().trim() : "";
                
                if (userEmailLower === ADMIN_EMAIL_CHECK.toLowerCase()) {
                    // Admin with no Firestore doc yet — create it and show dashboard
                    console.log("Admin with no doc - creating and showing dashboard");
                    userWelcome.textContent = `Hello, Paulo!`;
                    
                    const dashboardActionsEl = document.getElementById('dashboard-main-actions');
                    const profileWizardEl = document.getElementById('profile-wizard');
                    if (dashboardActionsEl) dashboardActionsEl.classList.remove('hidden');
                    if (profileWizardEl) profileWizardEl.classList.add('hidden');

                    const btnShowProfiles = document.getElementById('btn-show-profiles');
                    const btnShowForms = document.getElementById('btn-show-forms');
                    if (btnShowProfiles) { btnShowProfiles.classList.remove('hidden'); btnShowProfiles.onclick = () => window.location.href = 'perfis.html'; }
                    if (btnShowForms) { btnShowForms.classList.remove('hidden'); btnShowForms.onclick = () => window.location.href = 'formulario.html'; }
                    
                    // Create minimal admin doc
                    try {
                        await setDoc(doc(db, "users", user.uid), { name: "Paulo Morais", email: user.email, role: 'admin', profileCompleted: true, createdAt: new Date().toISOString() });
                    } catch(e) { console.warn("Could not create admin doc", e); }
                    
                    // Robust admin dashboard preview for no-doc case
                    try {
                        await loadDashboardPreview(true, user, { role: 'admin', profileCompleted: true });
                    } catch (previewError) {
                        console.error("Error loading admin preview (no-doc):", previewError);
                        const fallbackList = document.getElementById('preview-list');
                        const fallbackSection = document.getElementById('dashboard-preview-section');
                        if (fallbackSection) fallbackSection.classList.remove('hidden');
                        if (fallbackList) fallbackList.innerHTML = '<p class="color-text-dim text-center" style="padding: 20px; margin: 0;">Erro ao carregar dados da agenda.</p>';
                    }
                    return { role: 'admin', profileCompleted: true };
                }
                
                // Regular client with no doc — show profile wizard
                userWelcome.textContent = `Hello, ${user.displayName || user.email}!`;
                if (profName && user.displayName) profName.value = user.displayName;
                if (profEmail) profEmail.value = user.email || "";

                const calendarSection = document.getElementById('calendar-section');
                const adminCalendarSection = document.getElementById('admin-calendar-section');
                const dashboardActions = document.getElementById('dashboard-main-actions');
                const profileWizard = document.getElementById('profile-wizard');
                const cancelWizardBtn = document.getElementById('btn-cancel-wizard');

                if (calendarSection) calendarSection.classList.add('hidden');
                if (adminCalendarSection) adminCalendarSection.classList.add('hidden');
                if (dashboardActions) dashboardActions.classList.add('hidden');
                if (profileWizard) profileWizard.classList.remove('hidden');
                if (cancelWizardBtn) cancelWizardBtn.classList.add('hidden');
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            // Even on error, ensure admin preview stays visible if admin was detected
            const userEmailFallback = user.email ? user.email.toLowerCase().trim() : "";
            if (userEmailFallback === "pt@pmorais.pt") {
                console.log("Firestore error but admin detected — keeping preview visible");
                const fallbackSection = document.getElementById('dashboard-preview-section');
                const fallbackActions = document.getElementById('dashboard-main-actions');
                if (fallbackSection) fallbackSection.classList.remove('hidden');
                if (fallbackActions) fallbackActions.classList.remove('hidden');
                const fallbackList = document.getElementById('preview-list');
                if (fallbackList) fallbackList.innerHTML = '<p class="color-text-dim text-center" style="padding: 20px; margin: 0;">Database connection error. Try reloading.</p>';
            }
            return null;
        }
    }
    return null;
}

// Error Message Translation Helper
function translateError(code) {
    switch (code) {
        case 'auth/user-not-found':
            return 'User not found. Verify your email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already in use.';
        case 'auth/invalid-email':
            return 'Invalid email.';
        case 'auth/weak-password':
            return 'The password is too weak (minimum 6 characters).';
        case 'auth/popup-closed-by-user':
            return 'The login popup was closed before completing the process.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

// --- ADMIN WIZARD FIREBASE HOOKS --- //
window.saveAdminWizardSchedule = async function(slotsMap, weekId) {
    try {
        const docRef = doc(db, "weekly_schedules", weekId);
        
        // Preserve existing bookings!
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
        
        alert("Week published successfully in the system!");
        window.location.reload();
    } catch (e) {
        console.error("Erro ao guardar na base de dados:", e);
        alert("Error publishing: " + e.message);
    }
};

window.resendWeeklyBroadcast = async function(weekId) {
    try {
        const docRef = doc(db, "weekly_schedules", weekId);
        await updateDoc(docRef, {
            forceBroadcast: serverTimestamp()
        });
        alert("Agenda release notification resent successfully!");
    } catch (e) {
        console.error("Error resending notification:", e);
        alert("An error occurred while resending the notification.");
    }
};

window.loadAdminWizardSchedule = async function(weekId, callback) {
    try {
        const docRef = doc(db, "weekly_schedules", weekId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            callback(data.slots || {}, data.publishedByAdmin === true);
        } else {
            callback({}, false);
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        callback({}, false);
    }
};

window.submitWizardBooking = async function(payload, durationSlots) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        
        // Fetch user profile name as priority fallback
        let realName = payload.clientName || user.displayName;
        if (!realName) {
            try {
                const userProfile = await getDoc(doc(db, "users", user.uid));
                if (userProfile.exists()) {
                    realName = userProfile.data().name;
                }
            } catch (e) {
                console.warn("Could not fetch user profile name:", e);
            }
        }
        if (!realName) realName = user.email; // Final fallback
        
        // Group selections by weekId
        const weeks = {};
        payload.selections.forEach(sel => {
            const dateObj = new Date(sel.isoDate);
            const dayOfWeek = dateObj.getDay();
            dateObj.setDate(dateObj.getDate() - dayOfWeek);
            const weekYear = dateObj.getFullYear();
            const weekMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            const weekDay = String(dateObj.getDate()).padStart(2, '0');
            const weekId = `${weekYear}-${weekMonth}-${weekDay}`;
            
            if (!weeks[weekId]) weeks[weekId] = [];
            weeks[weekId].push(sel);
        });
        
        const historyToAdd = [];
        
        // Process each week
        for (const weekId of Object.keys(weeks)) {
            const docRef = doc(db, "weekly_schedules", weekId);
            const snap = await getDoc(docRef);
            let slots = snap.exists() ? (snap.data().slots || {}) : {};
            
            // Build nested slots object for proper Firestore structure
            const slotsToMerge = {};
            
            for (const sel of weeks[weekId]) {
                const baseTimeStr = sel.time;
                const [hStr, mStr] = baseTimeStr.split(':');
                let h = parseInt(hStr);
                let m = parseInt(mStr);
                
                let groupFull = false;
                
                for (let i = 0; i < durationSlots; i++) {
                    const timeStr = `${h.toString().padStart(2,'0')}:${m === 0 ? '00' : '30'}`;
                    const slotId = `${sel.isoDate}T${timeStr}`;
                    
                    const existingSlot = slots[slotId] || {};
                    
                    // Check if user already has a booking in this slot (prevent double-booking)
                    if (existingSlot.status === 'booked' && existingSlot.bookedBy === user.uid) {
                        throw new Error(`You already have a booking at ${timeStr} on ${sel.dateStr}. It is not possible to book two services at the same time.`);
                    }
                    
                    if (payload.modality === 'tr_online') {
                        // Online is group based
                        const users = existingSlot.bookedUsers || [];
                        if (users.length >= 10) {
                            groupFull = true;
                            break;
                        }
                        
                        // Check if user is already in this group slot
                        if (users.some(u => u.uid === user.uid)) {
                            throw new Error(`You are already registered for the online class at ${timeStr} on ${sel.dateStr}.`);
                        }
                        
                        // Add this user
                        const newUsers = [...users];
                        newUsers.push({ uid: user.uid, name: realName });
                        
                        slotsToMerge[slotId] = {
                            status: 'booked',
                            serviceType: 'grupal',
                            bookedUsers: newUsers,
                            bookedCount: newUsers.length,
                            clientNotes: payload.notes || ''
                        };
                    } else {
                        // Personal or Osteopatia
                        if (existingSlot.status === 'booked' || existingSlot.status === 'blocked') {
                            throw new Error(`Slot on ${sel.dateStr} at ${timeStr} is no longer available.`);
                        }
                        
                        let sType = 'treino_personalizado';
                        if (payload.category === 'osteopatia') sType = 'osteopatia';
                        
                        slotsToMerge[slotId] = {
                            status: 'booked',
                            serviceType: sType,
                            bookedBy: user.uid,
                            bookedName: realName,
                            clientNotes: payload.notes || ''
                        };
                    }
                    
                    // Increment 30 mins
                    m += 30;
                    if (m >= 60) {
                        h += 1;
                        m = 0;
                    }
                }
                
                if (groupFull) throw new Error(`The online class on ${sel.dateStr} at ${sel.time} is already full.`);
                
                // Add to history list
                let sType = payload.category === 'osteopatia' ? 'osteopatia' : 'treino';
                if (payload.modality === 'tr_online') sType = 'grupal';
                
                historyToAdd.push({
                    id: `bk_${Date.now()}_${Math.floor(Math.random()*10000)}`,
                    date: sel.isoDate,
                    time: sel.time,
                    serviceType: sType,
                    serviceName: payload.serviceName,
                    bookedName: realName,
                    status: 'booked',
                    clientNotes: payload.notes || '',
                    createdAt: new Date().toISOString()
                });
            }
            
            // Save week updates using proper nested structure
            if (Object.keys(slotsToMerge).length > 0) {
                await setDoc(docRef, { slots: slotsToMerge }, { merge: true });
            }
        }
        
        // Save to user booking history in weekly_schedules collection
        const bookingDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
        const bookingSnap = await getDoc(bookingDocRef);
        const existingBookings = bookingSnap.exists() ? (bookingSnap.data().bookings || []) : [];
        
        historyToAdd.forEach(h => existingBookings.push(h));
        
        await setDoc(bookingDocRef, {
            uid: user.uid,
            name: realName,
            email: user.email,
            bookings: existingBookings
        }, { merge: true });
        
        return true;
    } catch (e) {
        console.error("Booking error:", e);
        throw e;
    }
};

window.cancelClientBooking = async function(bookingId, isoDate, startTime, serviceType) {
    if (!confirm("Are you sure you want to cancel this session?")) return;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");

        // 1. Calculate duration slots
        let durationSlots = 1;
        if (serviceType === 'osteopatia') durationSlots = 2;
        if (serviceType === 'grupal' || serviceType === 'treino_grupo' || serviceType === 'treino_online' || serviceType === 'online') durationSlots = 2;
        if (serviceType === 'treino') durationSlots = 2; // All treinos are now 60 min

        // 2. Calculate weekId
        const dateObj = new Date(isoDate);
        const dayOfWeek = dateObj.getDay();
        dateObj.setDate(dateObj.getDate() - dayOfWeek);
        const weekYear = dateObj.getFullYear();
        const weekMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
        const weekDay = String(dateObj.getDate()).padStart(2, '0');
        const weekId = `${weekYear}-${weekMonth}-${weekDay}`;

        // 3. Update global weekly_schedules/{weekId}
        const docRef = doc(db, "weekly_schedules", weekId);
        const snap = await getDoc(docRef);
        let slotsToMerge = {};

        if (snap.exists()) {
            const currentSlots = snap.data().slots || {};
            let [hStr, mStr] = startTime.split(':');
            let h = parseInt(hStr);
            let m = parseInt(mStr);

            for (let i = 0; i < durationSlots; i++) {
                const timeStr = `${h.toString().padStart(2,'0')}:${m === 0 ? '00' : '30'}`;
                const slotId = `${isoDate}T${timeStr}`;

                if (currentSlots[slotId]) {
                    if (serviceType === 'grupal' || serviceType === 'treino_grupo' || serviceType === 'treino_online' || serviceType === 'online') {
                        // Remove user from bookedUsers
                        const users = currentSlots[slotId].bookedUsers || [];
                        const newUsers = users.filter(u => u.uid !== user.uid);
                        
                        if (newUsers.length === 0) {
                            slotsToMerge[slotId] = {
                                status: 'available',
                                serviceType: 'available',
                                bookedUsers: [],
                                bookedCount: 0
                            };
                        } else {
                            slotsToMerge[slotId] = {
                                status: 'booked',
                                serviceType: 'grupal',
                                bookedUsers: newUsers,
                                bookedCount: newUsers.length
                            };
                        }
                    } else {
                        // For personal/osteo, free the slot completely
                        slotsToMerge[slotId] = {
                            status: 'available',
                            serviceType: 'available',
                            bookedBy: null,
                            bookedName: null
                        };
                    }
                }

                m += 30;
                if (m >= 60) {
                    h += 1;
                    m = 0;
                }
            }
            if (Object.keys(slotsToMerge).length > 0) {
                await setDoc(docRef, { slots: slotsToMerge }, { merge: true });
            }
        }

        // 4. Update user's personal booking list in weekly_schedules/user_{uid}
        const bookingDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
        const bookingSnap = await getDoc(bookingDocRef);
        if (bookingSnap.exists()) {
            let userBookings = bookingSnap.data().bookings || [];
            for (let b of userBookings) {
                if (b.id === bookingId) {
                    b.status = 'cancelled';
                    b.updatedAt = new Date().toISOString();
                }
            }
            await setDoc(bookingDocRef, { bookings: userBookings }, { merge: true });
        }

        alert("Session cancelled successfully.");
        // Refresh UI
        window.location.reload();

    } catch (e) {
        console.error("Cancel booking error:", e);
        alert("Error cancelling session: " + e.message);
    }
};

async function loadDashboardPreview(isAdmin, user, data) {
    console.log("--- DASHBOARD PREVIEW START ---");
    console.log("isAdmin parameter:", isAdmin);
    console.log("User email:", user.email);
    console.log("Firestore Data:", data);
    const listEl = document.getElementById('preview-list');
    const titleEl = document.getElementById('preview-title');
    const previewSection = document.getElementById('dashboard-preview-section');
    const userDashboard = document.getElementById('user-dashboard');
    
    if (!listEl || !previewSection) {
        console.error("Critical dashboard elements missing");
        return;
    }
    
    // Ensure dashboard is visible
    if (userDashboard) userDashboard.classList.remove('hidden');
    previewSection.classList.remove('hidden');
    listEl.innerHTML = '<p class="color-text-dim text-center" style="padding: 20px; margin: 0;">Loading data...</p>';
    
    if (!isAdmin) {
        if (titleEl) {
            titleEl.textContent = "Your Upcoming Sessions";
            titleEl.className = "preview-title";
        }
        
        // Read bookings from weekly_schedules/user_{uid}
        let userBookings = [];
        try {
            const bookingDocRef = doc(db, "weekly_schedules", `user_${user.uid}`);
            const bookingSnap = await getDoc(bookingDocRef);
            if (bookingSnap.exists()) {
                userBookings = bookingSnap.data().bookings || [];
            }
        } catch (e) {
            console.warn("Could not load user bookings from weekly_schedules:", e);
        }
        
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const upcoming = userBookings.filter(h => {
            if (!h.date) return false;
            const bDate = new Date(h.date);
            return bDate >= now && h.status === 'booked';
        }).sort((a,b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        
        if (upcoming.length === 0) {
            listEl.innerHTML = `
                <p class="color-text-dim text-center" style="padding: 20px; margin: 0;">No sessions scheduled soon.</p>
            `;
            return;
        }
        
        listEl.innerHTML = '';
        upcoming.forEach(b => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            
            let sName = 'Training';
            let sClass = 'badge-treino';
            if (b.serviceType === 'grupal' || b.serviceType === 'treino_grupo') { sName = 'Online'; sClass = 'badge-grupal'; }
            if (b.serviceType === 'osteopatia') { sName = 'Osteopathy'; sClass = 'badge-osteo'; }
            if (b.serviceType === 'treino_online' || b.serviceType === 'online') { sName = 'Online'; sClass = 'badge-online'; }
            
            item.innerHTML = `
                <div class="preview-item-info">
                    <strong>${b.date}</strong>
                    <span>at ${b.time}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                    <div class="preview-badge ${sClass}">
                        ${sName}
                    </div>
                    <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.cancelClientBooking('${b.id}', '${b.date}', '${b.time}', '${b.serviceType}')">Cancel</button>
                </div>
            `;
            listEl.appendChild(item);
        });
        
    } else {
        // ------ ADMIN BRANCH — Read from all user booking docs ------
        if (titleEl) {
            titleEl.innerHTML = '<i data-lucide="calendar-days" style="width:18px;height:18px;"></i><span>Upcoming Clients</span>';
            titleEl.style.display = 'flex';
            titleEl.style.alignItems = 'center';
            titleEl.style.gap = '8px';
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        try {
            // Read ALL documents from weekly_schedules collection
            const allDocs = await getDocs(collection(db, "weekly_schedules"));
            const upcomingAdmin = [];

            allDocs.forEach(docSnap => {
                // Only process user booking documents (ID starts with "user_")
                if (!docSnap.id.startsWith('user_')) return;
                
                const data = docSnap.data();
                const bookings = data.bookings || [];
                
                bookings.forEach(b => {
                    if (!b.date || b.status !== 'booked') return;
                    const bDate = new Date(b.date);
                    if (bDate < now) return; // Skip past bookings
                    
                    upcomingAdmin.push({
                        name: b.bookedName || data.name || data.email || 'Client',
                        date: b.date,
                        time: b.time || '---',
                        type: b.serviceType
                    });
                });
            });

            // Sort by date and time
            upcomingAdmin.sort((a, b) => {
                const dtA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dtB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dtA - dtB;
            });

            if (upcomingAdmin.length === 0) {
                listEl.innerHTML = '<p class="color-text-dim text-center" style="padding: 20px; margin: 0;">No clients scheduled soon.</p>';
            } else {
                listEl.innerHTML = '';
                upcomingAdmin.forEach(b => {
                    const item = document.createElement('div');
                    item.className = 'preview-item';
                    
                    let sName = 'Training';
                    let sClass = 'badge-treino';
                    if (b.type === 'grupal') { sName = 'Online'; sClass = 'badge-grupal'; }
                    if (b.type === 'osteopatia') { sName = 'Osteopathy'; sClass = 'badge-osteo'; }

                    // Format date for display (YYYY-MM-DD → DD/MM)
                    let dateDisplay = b.date;
                    if (b.date && b.date.includes('-')) {
                        const [, mm, dd] = b.date.split('-');
                        dateDisplay = `${dd}/${mm}`;
                    }

                    item.innerHTML = `
                        <div class="preview-item-info">
                            <div style="display:flex; flex-direction:column;">
                                <strong style="color:var(--color-primary);">${b.name}</strong>
                                <span style="font-size:0.8rem; color:var(--color-text-dim);">${dateDisplay} at ${b.time}</span>
                            </div>
                        </div>
                        <div class="preview-badge ${sClass}">
                            ${sName}
                        </div>
                    `;
                    listEl.appendChild(item);
                });
            }
        } catch (e) {
            console.error("Error loading admin list:", e);
            listEl.innerHTML = `<p style="color:#c00; text-align:center; padding:20px;">Error loading list.</p>`;
        }
    }
    
    if (window.lucide) window.lucide.createIcons();
}
