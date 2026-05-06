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

// ===== Shared Branded Email Template Builder =====
// Generates a professional HTML email with the Paulo Morais branding.
// - title: The email heading displayed below the logo
// - bodyHtml: The main content HTML (paragraphs, lists, etc.)
// - ctaText: (optional) CTA button text
// - ctaUrl: (optional) CTA button URL
function buildEmailHtml({ title, bodyHtml, ctaText, ctaUrl }) {
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
                </tr>
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

          const mailOptions = {
            from: `"Paulo Morais" <${emailUser.value()}>`,
            bcc: bccList.join(","),
            subject: "A agenda da semana já está disponível!",
            html: buildEmailHtml({
              title: "Agenda Semanal Disponível",
              bodyHtml,
              ctaText: "&#128197;&nbsp;&nbsp;Agendar Agora",
              ctaUrl: "https://pmorais.pt/perfil.html?booking=true"
            })
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
        
        const notesRow = afterSlot.clientNotes
          ? `<tr><td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Nota</td><td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">${afterSlot.clientNotes}</td></tr>`
          : "";

        const bodyHtml = `
              <p style="margin:0 0 20px 0;">Foi registada uma nova reserva no sistema.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                <tr style="background-color:#f9f9f9;">
                  <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0; width:120px;">Cliente</td>
                  <td style="padding:8px 12px; color:#1a1a1a; font-size:14px; font-weight:700; border-bottom:1px solid #f0f0f0;">${afterSlot.bookedName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Data / Hora</td>
                  <td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">${slotId}</td>
                </tr>
                <tr style="background-color:#f9f9f9;">
                  <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0;">Serviço</td>
                  <td style="padding:8px 12px; color:#333; font-size:14px; border-bottom:1px solid #f0f0f0;">${afterSlot.serviceType || "N/A"}</td>
                </tr>
                ${notesRow}
              </table>`;

        const mailOptions = {
          from: `"Paulo Morais" <${emailUser.value()}>`,
          to: adminEmail,
          subject: `Nova Reserva: ${afterSlot.bookedName} (${slotId})`,
          html: buildEmailHtml({
            title: "Nova Reserva no Sistema",
            bodyHtml,
            ctaText: "Ver Painel de Gestão",
            ctaUrl: "https://pmorais.pt/perfil.html"
          })
        };
        await transporter.sendMail(mailOptions).catch(console.error);
      }

      // Cancellation Detection
      if (beforeSlot.status === "booked" && beforeSlot.bookedBy && afterSlot.status === "available" && !afterSlot.bookedBy) {
         console.log(`Booking cancelled at ${slotId} by ${beforeSlot.bookedName}`);

         const bodyHtml = `
              <p style="margin:0 0 20px 0;">Uma reserva foi cancelada no sistema.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                <tr style="background-color:#f9f9f9;">
                  <td style="padding:8px 12px; color:#999; font-size:14px; border-bottom:1px solid #f0f0f0; width:120px;">Cliente</td>
                  <td style="padding:8px 12px; color:#1a1a1a; font-size:14px; font-weight:700; border-bottom:1px solid #f0f0f0;">${beforeSlot.bookedName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px; color:#999; font-size:14px;">Data / Hora</td>
                  <td style="padding:8px 12px; color:#333; font-size:14px;">${slotId}</td>
                </tr>
              </table>`;
         
         const mailOptions = {
          from: `"Paulo Morais" <${emailUser.value()}>`,
          to: adminEmail,
          subject: `Reserva Cancelada: ${beforeSlot.bookedName} (${slotId})`,
          html: buildEmailHtml({
            title: "Reserva Cancelada",
            bodyHtml,
            ctaText: "Ver Painel de Gestão",
            ctaUrl: "https://pmorais.pt/perfil.html"
          })
        };
        await transporter.sendMail(mailOptions).catch(console.error);
      }
    }
    
    return null;
  });
