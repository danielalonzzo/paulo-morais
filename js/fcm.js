document.addEventListener('DOMContentLoaded', () => {
    const btnFCM = document.getElementById('btn-enable-fcm');
    if (btnFCM && window.firebase) {
        btnFCM.addEventListener('click', async () => {
            try {
                const messaging = firebase.messaging();
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const token = await messaging.getToken({ vapidKey: 'BMD6X...YOUR_VAPID_KEY...X' }); // Fallback / Needs VAPID
                    console.log('FCM Token:', token);
                    
                    // Em ambiente real, guardariamos o token no Firestore associado ao user:
                    // db.collection('profiles').doc(user.uid).update({ fcmToken: token });

                    const btnText = btnFCM.querySelector('.btn-text');
                    btnText.textContent = 'Notificações Ativas';
                    btnFCM.classList.add('success-state');
                    alert('Notificações ativadas com sucesso! Avisaremos-te se surgirem vagas.');
                } else {
                    alert('Permissão para notificações negada.');
                }
            } catch (err) {
                console.error('FCM Error:', err);
                alert('Erro ao configurar notificações: ' + err.message);
            }
        });
    }
});
