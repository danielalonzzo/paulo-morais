const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

// Definir los secretos que se almacenarán en Google Cloud Secret Manager
const emailUser = defineSecret("EMAIL_USER");
const emailPass = defineSecret("EMAIL_PASS");
const emailHost = defineSecret("EMAIL_HOST");
const emailPort = defineSecret("EMAIL_PORT");

exports.onWeeklyScheduleUpdated = functions
  .runWith({ secrets: [emailUser, emailPass, emailHost, emailPort] })
  .firestore
  .document("weekly_schedules/{weekId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;
    // Configurar el transporte de nodemailer usando los secretos
    const transporter = nodemailer.createTransport({
      host: emailHost.value(),
      port: parseInt(emailPort.value()),
      secure: parseInt(emailPort.value()) === 465, // true para 465, false para otros puertos
      auth: {
        user: emailUser.value(),
        pass: emailPass.value(),
      },
    });

    const beforeData = change.before.exists ? change.before.data() : {};
    const afterData = change.after.exists ? change.after.data() : {};
    const weekId = context.params.weekId;

    const adminEmail = "pt@pmorais.pt";

    // 1. Detect Agenda Publication (Broadcast to Clients)
    const wasPublished = beforeData.publishedByAdmin === true;
    const isPublished = afterData.publishedByAdmin === true;

    // Trigger email ONLY when the agenda is published for the first time
    // This corresponds to the "Publicar Agenda da Semana" button, NOT "Atualizar Agenda"
    if (!wasPublished && isPublished) {
      console.log(`Agenda ${weekId} published. Sending broadcast to clients...`);
      try {
        const usersSnap = await admin.firestore().collection("users").where("role", "==", "client").get();
        const bccList = [];
        usersSnap.forEach(doc => {
          const email = doc.data().email;
          if (email) bccList.push(email);
        });

        if (bccList.length > 0) {
          const mailOptions = {
            from: `"Paulo Morais" <${emailUser.value()}>`,
            bcc: bccList.join(","),
            subject: "A agenda da semana já está disponível!",
            html: `
              <h2>Olá!</h2>
              <p>A agenda para a semana a partir de <strong>${weekId}</strong> já se encontra disponível para marcações.</p>
              <p>Acede à tua área reservada para garantir o teu lugar.</p>
              <br>
              <p>Obrigado,<br>Paulo Morais</p>
            `
          };
          await transporter.sendMail(mailOptions);
          console.log(`Broadcast sent to ${bccList.length} clients.`);
        }
      } catch (error) {
        console.error("Error sending broadcast:", error);
      }
    }

    // 2. Detect New Bookings or Cancellations
    const beforeSlots = beforeData.slots || {};
    const afterSlots = afterData.slots || {};

    for (const slotId of Object.keys(afterSlots)) {
      const beforeSlot = beforeSlots[slotId] || {};
      const afterSlot = afterSlots[slotId] || {};

      // New Booking Detection
      if (beforeSlot.status !== "booked" && afterSlot.status === "booked" && afterSlot.bookedBy) {
        console.log(`New booking detected at ${slotId} by ${afterSlot.bookedName}`);
        
        const notesHtml = afterSlot.clientNotes
          ? `<li><strong>Nota do Cliente:</strong> ${afterSlot.clientNotes}</li>`
          : "";

        const mailOptions = {
          from: `"Notificações Sistema" <${emailUser.value()}>`,
          to: adminEmail,
          subject: `Nova Reserva: ${afterSlot.bookedName} (${slotId})`,
          html: `
            <h2>Nova Reserva no Sistema</h2>
            <ul>
              <li><strong>Cliente:</strong> ${afterSlot.bookedName || "N/A"}</li>
              <li><strong>Data/Hora:</strong> ${slotId}</li>
              <li><strong>Serviço:</strong> ${afterSlot.serviceType || "N/A"}</li>
              ${notesHtml}
            </ul>
          `
        };
        await transporter.sendMail(mailOptions).catch(console.error);
      }

      // Cancellation Detection
      if (beforeSlot.status === "booked" && beforeSlot.bookedBy && afterSlot.status === "available" && !afterSlot.bookedBy) {
         console.log(`Booking cancelled at ${slotId} by ${beforeSlot.bookedName}`);
         
         const mailOptions = {
          from: `"Notificações Sistema" <${emailUser.value()}>`,
          to: adminEmail,
          subject: `Reserva Cancelada: ${beforeSlot.bookedName} (${slotId})`,
          html: `
            <h2>Reserva Cancelada</h2>
            <ul>
              <li><strong>Cliente:</strong> ${beforeSlot.bookedName || "N/A"}</li>
              <li><strong>Data/Hora:</strong> ${slotId}</li>
            </ul>
          `
        };
        await transporter.sendMail(mailOptions).catch(console.error);
      }
    }
    
    return null;
  });
