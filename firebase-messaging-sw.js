importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCROYGriQ-5RWiLVCRwGz9KaDUKE6zNR2w",
    authDomain: "pmorais.pt",
    databaseURL: "https://paulo-morais-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "paulo-morais",
    storageBucket: "paulo-morais.firebasestorage.app",
    messagingSenderId: "431406968000",
    appId: "1:431406968000:web:a759ddc6912639d7c69125",
    measurementId: "G-GYWR102Y9N"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/images/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
