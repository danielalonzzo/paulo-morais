/*
 * Developed by Elysium λ Development & Research
 * A European company
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initCalendarMode } from './calendar.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCROYGriQ-5RWiLVCRwGz9KaDUKE6zNR2w",
    authDomain: "paulo-morais.firebaseapp.com",
    databaseURL: "https://paulo-morais-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "paulo-morais",
    storageBucket: "paulo-morais.firebasestorage.app",
    messagingSenderId: "431406968000",
    appId: "1:431406968000:web:a759ddc6912639d7c69125",
    measurementId: "G-GYWR102Y9N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

            // Load user data
            loadUserProfile(user);

            // Initialize Calendar System depending on Role
            initCalendarMode(user, db);
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
        });
    }

    if (btnCancelWizard) {
        btnCancelWizard.addEventListener('click', () => {
            profileWizard.classList.add('hidden');
            dashboardActions.classList.remove('hidden');
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const age = document.getElementById('prof-age').value;
            const conditions = document.getElementById('prof-conditions').value;

            try {
                await setDoc(doc(db, "users", user.uid), {
                    age: age,
                    conditions: conditions,
                    profileCompleted: true,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                alert("Perfil actualizado com sucesso!");
                // No longer just hide/show here, let loadUserProfile handle the source of truth
                loadUserProfile(user);
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Erro ao actualizar el perfil.");
            }
        });
    }
});

async function loadUserProfile(user) {
    const userWelcome = document.getElementById('user-welcome');
    const profAge = document.getElementById('prof-age');
    const profConditions = document.getElementById('prof-conditions');

    if (userWelcome) {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                userWelcome.textContent = `Olá, ${data.name || user.email}!`;

                // Populate wizard fields if they exist
                if (profAge && data.age) profAge.value = data.age;
                if (profConditions && data.conditions) profConditions.value = data.conditions;

                const calendarSection = document.getElementById('calendar-section');
                const dashboardActions = document.getElementById('dashboard-main-actions');
                const profileWizard = document.getElementById('profile-wizard');
                const cancelWizardBtn = document.getElementById('btn-cancel-wizard');

                if (data.role === 'admin') {
                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                } else if (data.profileCompleted) {
                    if (calendarSection) calendarSection.classList.remove('hidden');
                    if (dashboardActions) dashboardActions.classList.remove('hidden');
                    if (profileWizard) profileWizard.classList.add('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.remove('hidden');
                } else {
                    // Profile NOT completed and is client
                    if (calendarSection) calendarSection.classList.add('hidden');
                    if (dashboardActions) dashboardActions.classList.add('hidden');
                    if (profileWizard) profileWizard.classList.remove('hidden');
                    if (cancelWizardBtn) cancelWizardBtn.classList.add('hidden'); // Hide cancel if mandatory
                }

                // If profile is already completed, change button text
                const btnShowWizard = document.getElementById('btn-show-wizard');
                if (data.profileCompleted && btnShowWizard) {
                    btnShowWizard.textContent = "Editar Perfil";
                }
            } else {
                userWelcome.textContent = `Olá, ${user.email}!`;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
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
