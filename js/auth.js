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
    getDoc
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
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            authCard.classList.add('hidden');
            userDashboard.classList.remove('hidden');

            // IMMEDIATE ADMIN CHECK (for fast button visibility)
            const ADMIN_EMAIL = "pt@pmorais.pt";
            const btnShowProfiles = document.getElementById('btn-show-profiles');
            if (user.email === ADMIN_EMAIL && btnShowProfiles) {
                btnShowProfiles.classList.remove('hidden');
                btnShowProfiles.onclick = () => window.location.href = 'perfis.html';
            }

            // Load user data and wait for it to get the role
            const userData = await loadUserProfile(user);

            // Initialize Calendar System depending on Role and Profile Completion
            initCalendarMode(user, db, userData?.role, userData?.profileCompleted);
        } else {
            // User is signed out
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
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert("Por favor, preencha o email e a palavra-passe.");
                return;
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                console.error("Login error:", error);
                alert("Erro ao iniciar sessão: " + translateError(error.code));
            }
        });
    }

    // Register Event
    const registerBtn = document.getElementById('btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            if (!name || !email || !password) {
                alert("Por favor preencha todos os campos.");
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save additional user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    role: "client",
                    profileCompleted: false,
                    createdAt: new Date().toISOString()
                });

                console.log("User registered and data saved");
            } catch (error) {
                console.error("Registration error:", error);
                alert("Erro ao registar: " + translateError(error.code));
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
                alert("Por favor, introduza o seu email no campo de login primeiro.");
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                alert("Email de recuperação enviado! Verifique a sua caixa de entrada.");
            } catch (error) {
                console.error("Reset password error:", error);
                alert("Erro al enviar email: " + translateError(error.code));
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
    const profileForm = document.getElementById('profile-form');

    if (btnShowWizard) {
        btnShowWizard.addEventListener('click', () => {
            profileWizard.classList.remove('hidden');
            dashboardActions.classList.add('hidden');
            
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
                obsLabel.textContent = "Observações *";
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
                alert("Por favor, preencha todos os campos obrigatórios (*)");
                return;
            }

            // Conditional Validation for Observations
            if ((healthIssues === 'sim' || physicalLimits === 'sim') && !observations.trim()) {
                alert("Por favor, descreva os seus problemas de saúde o limitações nas Observações.");
                document.getElementById('prof-obs').focus();
                return;
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

                alert("Perfil actualizado com sucesso!");
                const updatedData = await loadUserProfile(user);
                // Refresh calendar state
                initCalendarMode(user, db, updatedData?.role, updatedData?.profileCompleted);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Erro ao actualizar o perfil.");
            }
        });
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
                userWelcome.textContent = `Olá, ${data.name || user.displayName || user.email}!`;

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
                        obsLabel.textContent = "Observações *";
                        obsHint.classList.remove('hidden');
                    }
                }

                const calendarSection = document.getElementById('calendar-section');
                const adminCalendarSection = document.getElementById('admin-calendar-section');
                const dashboardActions = document.getElementById('dashboard-main-actions');
                const profileWizard = document.getElementById('profile-wizard');
                const cancelWizardBtn = document.getElementById('btn-cancel-wizard');

                const btnShowProfiles = document.getElementById('btn-show-profiles');
                const ADMIN_EMAIL = "pt@pmorais.pt";

                if (data.role === 'admin' || user.email === ADMIN_EMAIL) {
                    // AUTO-FIX: Ensure Paulo has the admin role in Firestore
                    if (data.role !== 'admin' && user.email === ADMIN_EMAIL) {
                        try {
                            await setDoc(doc(db, "users", user.uid), { role: 'admin' }, { merge: true });
                            console.log("Admin role auto-fixed for Paulo.");
                        } catch (e) {
                            console.warn("Could not auto-fix admin role. Possibly rules restricted.", e);
                        }
                    }

                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.remove('hidden');
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                    if (btnShowProfiles) {
                        btnShowProfiles.classList.remove('hidden');
                        btnShowProfiles.onclick = () => window.location.href = 'perfis.html';
                    }
                } else if (data.profileCompleted) {
                    if (calendarSection) calendarSection.classList.remove('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.remove('hidden');
                } else {
                    // Profile NOT completed and is client
                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (adminCalendarSection) adminCalendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.add('hidden');
                    if (profileWizard) profileWizard.classList.remove('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.add('hidden'); // Hide cancel if mandatory
                }

                // If profile is already completed, change button text
                const btnShowWizard = document.getElementById('btn-show-wizard');
                if (data.profileCompleted && btnShowWizard) {
                    btnShowWizard.textContent = "Editar Perfil";
                }
                return data;
            } else {
                userWelcome.textContent = `Olá, ${user.displayName || user.email}!`;
                if (profName && user.displayName) profName.value = user.displayName;
                if (profEmail) profEmail.value = user.email || "";

                // Fallback for Admin account if no document exists yet
                const ADMIN_EMAIL = "pt@pmorais.pt";
                if (user.email === ADMIN_EMAIL) {
                    const btnShowProfiles = document.getElementById('btn-show-profiles');
                    if (btnShowProfiles) {
                        btnShowProfiles.classList.remove('hidden');
                        btnShowProfiles.onclick = () => window.location.href = 'perfis.html';
                    }
                }
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    }
    return null;
}

// Error Message Translation Helper
function translateError(code) {
    switch (code) {
        case 'auth/user-not-found':
            return 'Utilizador não encontrado.';
        case 'auth/wrong-password':
            return 'Palavra-passe incorrecta.';
        case 'auth/email-already-in-use':
            return 'Este email já está a ser utilizado.';
        case 'auth/invalid-email':
            return 'Email inválido.';
        case 'auth/weak-password':
            return 'A palavra-passe é demasiado fraca (mínimo 6 caracteres).';
        case 'auth/popup-closed-by-user':
            return 'A janela de login foi fechada antes de completar o processo.';
        default:
            return 'Ocorreu un erro inesperado. Tente novamente.';
    }
}
