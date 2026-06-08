import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import nodemailer from "nodemailer";

// ── CORS headers returned on every response ───────────────────────────────────
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(body),
  };
}

// ── Email HTML template ───────────────────────────────────────────────────────
function buildEmailHtml(bookingId: string, displayName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:0;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- Header -->
        <tr>
          <td style="background:#18181b;padding:24px 32px;">
            <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.15em;color:#ffffff;">PINTASSO</p>
          </td>
        </tr>

        <!-- Check icon -->
        <tr>
          <td align="center" style="padding:40px 32px 0;">
            <div style="width:72px;height:72px;border-radius:50%;background:#f0fdf4;border:2px solid #bbf7d0;display:inline-flex;align-items:center;justify-content:center;">
              <span style="font-size:32px;line-height:1;color:#16a34a;">&#10003;</span>
            </div>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:20px 32px 8px;">
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#18181b;">&#161;Visita Confirmada!</h1>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td align="center" style="padding:0 32px 32px;">
            <p style="margin:0;font-size:15px;color:#71717a;line-height:1.6;">
              Hola ${displayName}, su visita t&#233;cnica ha sido agendada exitosamente.
            </p>
          </td>
        </tr>

        <!-- Order card -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border:1px solid #e4e4e7;">
              <tr>
                <td align="center" style="padding:24px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">
                    N&#250;mero de Orden / C&#243;digo de Reserva
                  </p>
                  <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.08em;color:#663de4;">${bookingId}</p>
                  <p style="margin:6px 0 0;font-size:12px;color:#a1a1aa;">Guarde este c&#243;digo como referencia</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">
              &#191;Qu&#233; sigue?
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:24px;height:24px;border-radius:50%;background:#f0fdf4;text-align:center;vertical-align:middle;font-size:11px;font-weight:900;color:#16a34a;">1</td>
                  <td style="padding-left:12px;font-size:13px;color:#52525b;line-height:1.5;">Nuestro equipo se presentar&#225; puntualmente en el horario que eligi&#243;.</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:8px 0;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:24px;height:24px;border-radius:50%;background:#f0fdf4;text-align:center;vertical-align:middle;font-size:11px;font-weight:900;color:#16a34a;">2</td>
                  <td style="padding-left:12px;font-size:13px;color:#52525b;line-height:1.5;">Realizaremos el levantamiento digital y la captura fotogr&#225;fica del espacio.</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:8px 0;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:24px;height:24px;border-radius:50%;background:#f0fdf4;text-align:center;vertical-align:middle;font-size:11px;font-weight:900;color:#16a34a;">3</td>
                  <td style="padding-left:12px;font-size:13px;color:#52525b;line-height:1.5;">En menos de 24 horas recibir&#225; su render fotorrealista y presupuesto cerrado.</td>
                </tr></table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f5;border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">&#169; 2026 PINTASSO &mdash; pintasso.cl</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method.toUpperCase();

  // Pre-flight
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // Parse body
  let bookingId: string, name: string, email: string;
  try {
    const body = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    bookingId = String(body.bookingId ?? "").trim();
    name = String(body.name ?? "Cliente").trim();
    email = String(body.email ?? "").trim();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!bookingId || !email) {
    return json(400, { error: "bookingId and email are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Invalid email address" });
  }

  // Credentials come exclusively from Lambda environment variables
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars");
    return json(500, { error: "Email service not configured" });
  }

  // Build transporter — port 465 with TLS
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"PINTASSO" <${gmailUser}>`,
      to: email,
      subject: `¡Visita Confirmada! Código ${bookingId} — PINTASSO`,
      html: buildEmailHtml(bookingId, name),
    });

    return json(200, { ok: true, bookingId });
  } catch (err) {
    console.error("SMTP send failed:", err);
    return json(502, { error: "Failed to send email" });
  }
};
