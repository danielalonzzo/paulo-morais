const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const nodemailer = require("nodemailer");
const { defineSecret } = require("firebase-functions/params");
const { google } = require("googleapis");


// ===== Google Calendar Integration =====
const serviceAccount = require("./service-account.json");
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: SCOPES,
});
const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = 'pt.pmorais.agenda@gmail.com';

// Definir los secretos que se almacenarán en Google Cloud Secret Manager
const emailUser = defineSecret("EMAIL_USER");
const emailPass = defineSecret("EMAIL_PASS");
const emailHost = defineSecret("EMAIL_HOST");
const emailPort = defineSecret("EMAIL_PORT");

// ===== Shared Branded Email Template Builder =====
// Generates a professional HTML email with the Paulo Morais branding.
// - title: The email heading displayed below the logo
// - bodyHtml: The main content HTML (paragraphs, lists, etc.)
// - ctaText: (optional) CTA button text
// - ctaUrl: (optional) CTA button URL
function buildEmailHtml({ title, bodyHtml, ctaText, ctaUrl, unsubscribeUrl }) {
  const currentYear = new Date().getFullYear();

  const ctaBlock = ctaText && ctaUrl ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 36px 32px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#E6AE17; border-radius:8px;">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:14px 40px; font-size:16px; font-weight:700; color:#1a1a1a; text-decoration:none; letter-spacing:0.5px; text-transform:uppercase;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding: 30px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Logo (rounded) -->
          <tr>
            <td align="center" style="background-color:#1a1a1a; padding: 32px 20px;">
              <img src="https://pmorais.pt/images/logo/logo_f_amarelo.png" alt="Paulo Morais" width="140" style="display:block; max-width:140px; height:auto; border-radius:18px;" />
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="background:#E6AE17; height:4px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 32px 36px 0 36px;">
              <h2 style="margin:0; font-size:22px; font-weight:800; color:#1a1a1a; letter-spacing:-0.3px;">${title}</h2>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 36px 24px 36px; font-size:16px; line-height:1.7; color:#333333;">
              ${bodyHtml}
            </td>
          </tr>

          ${ctaBlock}

          <!-- Closing signature -->
          <tr>
            <td style="padding: 0 36px 36px 36px; border-top: 1px solid #eee;">
              <p style="margin:24px 0 0 0; font-size:16px; line-height:1.7; color:#333333;">Com os melhores cumprimentos,</p>
              <p style="margin:4px 0 0 0; font-size:17px; font-weight:700; color:#1a1a1a;">Paulo Morais</p>
              <p style="margin:2px 0 0 0; font-size:13px; color:#999999; letter-spacing:0.3px;">Osteopata &amp; Especialista em Treino Personalizado</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a1a; padding: 28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://www.instagram.com/pt.paulomorais" target="_blank" style="display:inline-block; width:36px; height:36px; line-height:36px; text-align:center; background-color:#333333; border-radius:50%; text-decoration:none;" title="Instagram">
                            <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="18" height="18" style="display:block; margin:9px auto; border:0;" />
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://wa.me/351960471537" target="_blank" style="display:inline-block; width:36px; height:36px; line-height:36px; text-align:center; background-color:#333333; border-radius:50%; text-decoration:none;" title="WhatsApp">
                            <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" width="18" height="18" style="display:block; margin:9px auto; border:0;" />
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="mailto:pt@pmorais.pt" style="display:inline-block; width:36px; height:36px; line-height:36px; text-align:center; background-color:#333333; border-radius:50%; text-decoration:none;" title="Email">
                            <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" width="18" height="18" style="display:block; margin:9px auto; border:0;" />
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://pmorais.pt" target="_blank" style="display:inline-block; width:36px; height:36px; line-height:36px; text-align:center; background-color:#333333; border-radius:50%; text-decoration:none;" title="Website">
                            <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="18" height="18" style="display:block; margin:9px auto; border:0;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px 0; font-size:13px; color:#999999;">
                      <a href="https://pmorais.pt" target="_blank" style="color:#E6AE17; text-decoration:none; font-weight:600;">pmorais.pt</a>
                    </p>
                    <p style="margin:0; font-size:11px; color:#666666;">Lisboa, Portugal &nbsp;&middot;&nbsp; &copy; ${currentYear} Paulo Morais</p>
                  </td>
                </tr>${unsubscribeUrl ? `
                <tr>
                  <td align="center" style="padding-top:18px;">
                    <a href="${unsubscribeUrl}" target="_blank" style="color:#555555; font-size:10px; text-decoration:none; letter-spacing:0.2px;">Desinscrever-se das notificações</a>
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

    // Also check if admin explicitly requested a resend
    const forceBroadcastBefore = beforeData.forceBroadcast ? beforeData.forceBroadcast.toMillis() : 0;
    const forceBroadcastAfter = afterData.forceBroadcast ? afterData.forceBroadcast.toMillis() : 0;
    const isForceBroadcast = forceBroadcastAfter > forceBroadcastBefore;

    // Trigger email ONLY when the agenda is published for the first time OR when forced
    // This corresponds to the "Publicar Agenda da Semana" or "Notificar libertação de agenda novamente" buttons
    if ((!wasPublished && isPublished) || isForceBroadcast) {
      console.log(`Agenda ${weekId} published or forced. Sending broadcast to clients...`);
      try {
        const usersSnap = await admin.firestore().collection("users").where("role", "==", "client").get();
        const bccList = [];
        usersSnap.forEach(doc => {
          const data = doc.data();
          // Skip users who have unsubscribed from email notifications
          if (data.email && data.unsubscribed !== true) bccList.push(data.email);
        });

        if (bccList.length > 0) {
          // Calcular el rango de fechas de la semana
          const [y, m, d] = weekId.split("-").map(Number);
          const startDate = new Date(y, m - 1, d);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);

          const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const startDay = String(startDate.getDate()).padStart(2, "0");
          const endDay = String(endDate.getDate()).padStart(2, "0");
          const startMonth = monthNames[startDate.getMonth()];
          const endMonth = monthNames[endDate.getMonth()];

          let dateRangeText = `del ${startDay} al ${endDay} de ${endMonth} del ${endDate.getFullYear()}`;
          if (startDate.getMonth() !== endDate.getMonth()) {
            dateRangeText = `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} del ${endDate.getFullYear()}`;
          }

          const bodyHtml = `
              <p style="margin:0 0 20px 0;">Estimados,</p>
              <p style="margin:0 0 20px 0;">Informamos que a agenda da semana <strong style="color:#1a1a1a;">${dateRangeText}</strong> já se encontra aberta para novas marcações.</p>
              <p style="margin:0 0 4px 0;">Para garantir o seu horário de preferência, por favor, aceda à sua área reservada através da sua conta:</p>`;

          // Send individually so each user gets their own unsubscribe link
          for (const clientEmail of bccList) {
            const token = Buffer.from(clientEmail).toString("base64");
            const unsubUrl = `https://pmorais.pt/desinscrever.html?token=${encodeURIComponent(token)}`;
            const mailOptions = {
              from: `"Paulo Morais" <${emailUser.value()}>`,
              to: clientEmail,
              subject: "A agenda da semana já está disponível!",
              html: buildEmailHtml({
                title: "Agenda Semanal Disponível",
                bodyHtml,
                ctaText: "&#128197;&nbsp;&nbsp;Agendar Agora",
                ctaUrl: "https://pmorais.pt/perfil.html?booking=true",
                unsubscribeUrl: unsubUrl
              }),
              headers: {
                "List-Unsubscribe": `<${unsubUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
              }
            };
            await transporter.sendMail(mailOptions);
          }
          console.log(`Broadcast sent individually to ${bccList.length} clients.`);        }
      } catch (error) {
        console.error("Error sending broadcast:", error);
      }
    }

    // 2. Detect New Bookings or Cancellations
    const beforeSlots = beforeData.slots || {};
    const afterSlots = afterData.slots || {};

    const newBookings = [];
    const newCancellations = [];

    for (const slotId of Object.keys(afterSlots)) {
      const beforeSlot = beforeSlots[slotId] || {};
      const afterSlot = afterSlots[slotId] || {};

      // New Booking Detection (Personal/Osteo/Group)
      const isNewPersonal = beforeSlot.status !== "booked" && afterSlot.status === "booked" && afterSlot.bookedBy;
      const isNewGroupJoin = afterSlot.serviceType === "grupal" && (afterSlot.bookedCount || 0) > (beforeSlot.bookedCount || 0);

      if (isNewPersonal || isNewGroupJoin) {
        let name = afterSlot.bookedName;
        let clientUid = afterSlot.bookedBy;
        if (isNewGroupJoin) {
          const beforeUsers = beforeSlot.bookedUsers || [];
          const afterUsers = afterSlot.bookedUsers || [];
          const joiner = afterUsers.find(au => !beforeUsers.some(bu => bu.uid === au.uid));
          if (joiner) {
            name = joiner.name;
            clientUid = joiner.uid;
          } else {
            name = "Novo Aluno";
          }
        }
        newBookings.push({ slotId, data: afterSlot, clientName: name, clientUid });
      }

      // Cancellation Detection: Detect if it WAS booked but NOW it isn't (available, blocked, or deleted)
      const wasPersonal = beforeSlot.status === "booked" && beforeSlot.bookedBy;
      const isNowPersonal = afterSlot.status === "booked" && afterSlot.bookedBy;
      const isPersonalCanc = wasPersonal && !isNowPersonal;
      
      const beforeCount = beforeSlot.bookedCount || (beforeSlot.bookedUsers ? beforeSlot.bookedUsers.length : 0);
      const afterCount = afterSlot.bookedCount || (afterSlot.bookedUsers ? afterSlot.bookedUsers.length : 0);
      const isGroupCanc = beforeSlot.serviceType === "grupal" && afterCount < beforeCount;

      if (isPersonalCanc || isGroupCanc) {
        let name = beforeSlot.bookedName;
        if (isGroupCanc && !name) {
          const beforeUsers = beforeSlot.bookedUsers || [];
          const afterUsers = afterSlot.bookedUsers || [];
          const leaver = beforeUsers.find(bu => !afterUsers.some(au => au.uid === bu.uid));
          name = leaver ? leaver.name : "Aluno";
        }
        newCancellations.push({ slotId, data: beforeSlot, clientName: name });
      }
    }

    // --- HANDLE NEW BOOKINGS (Unified Email + GCal) ---
    if (newBookings.length > 0) {
      console.log(`${newBookings.length} new slots detected. Processing unified email...`);
      
      const mainClientName = newBookings[0].clientName || "N/A";
      const clientNotes = newBookings[0].data.clientNotes || "Nenhuma";
      const serviceType = newBookings[0].data.serviceType || "N/A";
      
      // Sort chronologically
      newBookings.sort((a, b) => a.slotId.localeCompare(b.slotId));

      let sessionItemsHtml = "";
      let vEventsICS = ""; // For ICS file
      for (const b of newBookings) {
        // --- Google Calendar Integration ---
        // Avoid duplicate/overlapping events for contiguous 30-min slots in the same batch
        const [datePart, timePart] = b.slotId.split('T');
        const [hour, minute] = timePart.split(':').map(Number);
        const prevMinute = minute === 0 ? 30 : 0;
        const prevHour = minute === 0 ? hour - 1 : hour;
        const prevSlotId = `${datePart}T${prevHour.toString().padStart(2, '0')}:${prevMinute.toString().padStart(2, '0')}`;
        
        const isContinuation = newBookings.some(nb => nb.slotId === prevSlotId);
        
        // ONLY trigger event creation and email listing for the START of a session
        if (!isContinuation) {
          // Determine session duration (usually 60 mins = 2 slots)
            let durationMinutes = 30;
            let checkHour = hour;
            let checkMinute = minute;
            while (true) {
              checkMinute += 30;
              if (checkMinute >= 60) { checkHour += 1; checkMinute = 0; }
              const nextId = `${datePart}T${checkHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
              if (newBookings.some(nb => nb.slotId === nextId)) {
                durationMinutes += 30;
              } else {
                break;
              }
            }

            // Ensure at least 60 mins if it's one of Paulo's services (Personal/Osteo/Online)
            // (Client UI already handles this, but we force it here for GCal correctness)
            if (durationMinutes < 60) durationMinutes = 60;

          const startDateTime = `${datePart}T${timePart}:00`;
          const endMoment = new Date(startDateTime);
          endMoment.setMinutes(endMoment.getMinutes() + durationMinutes);

          try {
            // Format to YYYY-MM-DDTHH:mm:ss
            const endDateTime = endMoment.getFullYear() + "-" + 
                                String(endMoment.getMonth() + 1).padStart(2, '0') + "-" + 
                                String(endMoment.getDate()).padStart(2, '0') + "T" + 
                                String(endMoment.getHours()).padStart(2, '0') + ":" + 
                                String(endMoment.getMinutes()).padStart(2, '0') + ":00";

            const event = {
              summary: `Reserva: ${b.clientName} (${b.data.serviceType || 'Serviço'})`,
              description: `Cliente: ${b.clientName}\nServiço: ${b.data.serviceType || 'N/A'}\nNotas: ${clientNotes}`,
              start: { dateTime: startDateTime, timeZone: 'Europe/Lisbon' },
              end: { dateTime: endDateTime, timeZone: 'Europe/Lisbon' },
            };

            const calendarResponse = await calendar.events.insert({ calendarId: CALENDAR_ID, resource: event });
            const eventId = calendarResponse.data.id;
            console.log(`Google Calendar event created: ${eventId} (${durationMinutes} min)`);
            
            // Link event ID to the start slot
            await admin.firestore().doc(`weekly_schedules/${weekId}`).update({
              [`slots.${b.slotId}.googleEventId`]: eventId
            });
          } catch (error) {
            console.error("Error creating Google Calendar event:", error.response ? JSON.stringify(error.response.data) : error);
          }

          // Add to the email list with full time range
          const startTime = timePart;
          const endTime = `${String(endMoment.getHours()).padStart(2, '0')}:${String(endMoment.getMinutes()).padStart(2, '0')}`;
          sessionItemsHtml += `<li style="margin-bottom:4px;">${datePart.split('-').reverse().join('/')}: <strong>${startTime} às ${endTime}</strong></li>`;
          
          // Build ICS VEVENT
          const dtStartICSLocal = startDateTime.replace(/[-:]/g, ''); 
          const dtEndICSLocal = endDateTime.replace(/[-:]/g, '');
          const nowICS = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
          
          vEventsICS += `BEGIN:VEVENT\r\n` +
                        `UID:${b.slotId}-${mainClientName.replace(/\\s+/g, '')}@pmorais.pt\r\n` +
                        `DTSTAMP:${nowICS}\r\n` +
                        `DTSTART;TZID=Europe/Lisbon:${dtStartICSLocal}\r\n` +
                        `DTEND;TZID=Europe/Lisbon:${dtEndICSLocal}\r\n` +
                        `SUMMARY:Sessão de ${serviceType} com Paulo Morais\r\n` +
                        `DESCRIPTION:${clientNotes !== "Nenhuma" ? clientNotes : "Reserva confirmada."}\r\n` +
                        `END:VEVENT\r\n`;
        }
      }

      const notesRow = clientNotes !== "Nenhuma"
        ? `<tr><td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Nota</td><td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">${clientNotes}</td></tr>`
        : "";

      const bodyHtml = `
            <p style="margin:0 0 20px 0;">Foi registada uma nova reserva no sistema.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:8px; overflow:hidden; margin-bottom:8px;">
              <tr style="background-color:#f9f9f9;">
                <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0; width:120px;">Cliente</td>
                <td style="padding:8px 12px; color:#1a1a1a; font-size:14px; font-weight:700; border-bottom:1px solid #f0f0f0;">${mainClientName}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Sessões</td>
                <td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">
                  <ul style="margin:0; padding-left:18px;">${sessionItemsHtml}</ul>
                </td>
              </tr>
              <tr style="background-color:#f9f9f9;">
                <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Serviço</td>
                <td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">${serviceType}</td>
              </tr>
              ${notesRow}
            </table>`;

      const mailOptions = {
        from: `"Paulo Morais" <${emailUser.value()}>`,
        to: adminEmail,
        subject: `Nova Reserva: ${mainClientName} (${newBookings.length} horários)`,
        html: buildEmailHtml({
          title: "Nova Reserva no Sistema",
          bodyHtml,
          ctaText: "Ver Painel de Gestão",
          ctaUrl: "https://pmorais.pt/perfil.html"
        })
      };
      await transporter.sendMail(mailOptions).catch(console.error);

      // --- Send Client Confirmation Email with ICS ---
      const clientUid = newBookings[0].clientUid;
      if (clientUid) {
        try {
          const clientSnap = await admin.firestore().collection("users").doc(clientUid).get();
          if (clientSnap.exists) {
            const clientData = clientSnap.data();
            if (clientData.email && clientData.unsubscribed !== true) {
              const icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Paulo Morais//Agenda//PT\r\nCALSCALE:GREGORIAN\r\n${vEventsICS}END:VCALENDAR`;
              
              const clientBodyHtml = `
                <p style="margin:0 0 20px 0;">Olá ${mainClientName.split(' ')[0]},</p>
                <p style="margin:0 0 20px 0;">A sua reserva para <strong>${serviceType}</strong> foi confirmada com sucesso!</p>
                <p style="margin:0 0 8px 0;"><strong>Resumo das Sessões:</strong></p>
                <ul style="margin:0 0 20px 0; padding-left:18px;">${sessionItemsHtml}</ul>
                <p style="margin:0 0 20px 0;">Em anexo encontra um ficheiro para adicionar rapidamente as sessões ao seu calendário digital.</p>
              `;

              const token = Buffer.from(clientData.email).toString("base64");
              const unsubUrl = `https://pmorais.pt/desinscrever.html?token=${encodeURIComponent(token)}`;

              const clientMailOptions = {
                from: `"Paulo Morais" <${emailUser.value()}>`,
                to: clientData.email,
                subject: `Reserva Confirmada: ${serviceType}`,
                html: buildEmailHtml({
                  title: "Reserva Confirmada",
                  bodyHtml: clientBodyHtml,
                  ctaText: "Ver no meu Perfil",
                  ctaUrl: "https://pmorais.pt/perfil.html",
                  unsubscribeUrl: unsubUrl
                }),
                attachments: [
                  {
                    filename: 'reserva_paulo_morais.ics',
                    content: icsContent,
                    contentType: 'text/calendar'
                  }
                ],
                headers: {
                  "List-Unsubscribe": `<${unsubUrl}>`,
                  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
                }
              };

              await transporter.sendMail(clientMailOptions);
              console.log(`Confirmation email sent to client: ${clientData.email}`);
            }
          }
        } catch (e) {
          console.error("Error sending client confirmation email:", e);
        }
      }
    }

    // --- HANDLE CANCELLATIONS (Unified Email + GCal) ---
    if (newCancellations.length > 0) {
      console.log(`${newCancellations.length} slots cancelled. Processing unified email...`);
      const mainClientName = newCancellations[0].clientName || "N/A";
      
      newCancellations.sort((a, b) => a.slotId.localeCompare(b.slotId));
      
      let sessionItemsHtml = "";
      for (const c of newCancellations) {
        // --- Google Calendar Integration: Delete Event ---
        if (c.data.googleEventId) {
          try {
            await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: c.data.googleEventId });
            console.log(`Google Calendar event deleted: ${c.data.googleEventId}`);
          } catch (error) {
            console.error("Error deleting Google Calendar event:", error.response ? JSON.stringify(error.response.data) : error);
          }
        }
        
        const [datePart, timePart] = c.slotId.split('T');
        const [hour, minute] = timePart.split(':').map(Number);
        const prevMinute = minute === 0 ? 30 : 0;
        const prevHour = minute === 0 ? hour - 1 : hour;
        const prevSlotId = `${datePart}T${prevHour.toString().padStart(2, '0')}:${prevMinute.toString().padStart(2, '0')}`;
        
        // Find end of contiguous block for the email
        let durationMinutes = 30;
        let checkHour = hour;
        let checkMinute = minute;
        while (true) {
          checkMinute += 30;
          if (checkMinute >= 60) { checkHour += 1; checkMinute = 0; }
          const nextId = `${datePart}T${checkHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
          if (newCancellations.some(nc => nc.slotId === nextId)) {
            durationMinutes += 30;
          } else {
            break;
          }
        }
        const endTime = new Date(`${datePart}T${timePart}:00`);
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

        if (!newCancellations.some(nc => nc.slotId === prevSlotId)) {
          sessionItemsHtml += `<li>${datePart.split('-').reverse().join('/')}: <strong>${timePart} às ${endTimeStr}</strong></li>`;
        }
      }

      const bodyHtml = `
            <p style="margin:0 0 20px 0;">Uma reserva foi cancelada no sistema.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:8px; overflow:hidden; margin-bottom:8px;">
              <tr style="background-color:#f9f9f9;">
                <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0; width:120px;">Cliente</td>
                <td style="padding:8px 12px; color:#1a1a1a; font-size:14px; font-weight:700; border-bottom:1px solid #f0f0f0;">${mainClientName}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px; color:#999; font-size:14px;">Sessões</td>
                <td style="padding:8px 12px; color:#333; font-size:14px;">
                  <ul style="margin:0; padding-left:18px;">${sessionItemsHtml}</ul>
                </td>
              </tr>
            </table>`;
      
      const mailOptions = {
        from: `"Paulo Morais" <${emailUser.value()}>`,
        to: adminEmail,
        subject: `Reserva Cancelada: ${mainClientName}`,
        html: buildEmailHtml({
          title: "Reserva Cancelada",
          bodyHtml,
          ctaText: "Ver Painel de Gestão",
          ctaUrl: "https://pmorais.pt/perfil.html"
        })
      };
      await transporter.sendMail(mailOptions).catch(console.error);
    }

    return null;
  });

// ===== Unsubscribe HTTP Endpoint =====
// Handles GET requests from the unsubscribe link in emails.
// Sets unsubscribed:true on the user's Firestore document.
exports.handleUnsubscribe = functions
  .runWith({ secrets: [] })
  .https
  .onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "https://pmorais.pt");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      const token = req.query.token || req.body.token;
      if (!token) {
        return res.status(400).json({ success: false, error: "Token em falta." });
      }

      const email = Buffer.from(token, "base64").toString("utf-8");
      if (!email || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "Token inválido." });
      }

      // Find user document by email
      const usersSnap = await admin.firestore()
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (usersSnap.empty) {
        // Still return success to not leak information
        return res.status(200).json({ success: true });
      }

      const userDoc = usersSnap.docs[0];
      await userDoc.ref.update({ unsubscribed: true });

      console.log(`User ${email} has unsubscribed from email notifications.`);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing unsubscribe:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  });
