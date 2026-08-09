const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM || process.env.SMTP_FROM || "Loomy <loomy.app.info@gmail.com>";

function parseFrom(raw: string): { email: string; name: string } {
  const match = raw.trim().match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "Loomy", email: raw.trim() };
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  name: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY env degiskeni ayarlanmamis.");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                  <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">Loomy</h1>
                  <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">E-posta Dogrulama</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="color:#333;font-size:16px;margin:0 0 16px;">Merhaba <strong>${name}</strong>,</p>
                  <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Hesabinizi dogrulamak icin asagidaki 6 haneli kodu kullanin:
                  </p>
                  <div style="background-color:#f8f7ff;border:2px dashed #6366f1;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
                    <span style="font-size:32px;font-weight:700;color:#6366f1;letter-spacing:8px;font-family:monospace;">${code}</span>
                  </div>
                  <p style="color:#999;font-size:12px;margin:0 0 8px;">Bu kod <strong>15 dakika</strong> sureyle gecerlidir.</p>
                  <p style="color:#999;font-size:12px;margin:0;">
                    Eger bu kayit islemini siz baslatmadiysaniz, bu e-postayi goz ardı edebilirsiniz.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 24px;border-top:1px solid #f0f0f0;">
                  <p style="color:#bbb;font-size:11px;margin:0;text-align:center;">
                    &copy; ${new Date().getFullYear()} Loomy. Tum haklari saklidir.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const from = parseFrom(SENDGRID_FROM);
  const text = `Merhaba ${name},\n\nE-posta dogrulama kodunuz: ${code}\n\nBu kod 15 dakika gecerlidir.`;

  console.log(`[email] dogrulama maili gonderiliyor -> to=${to} from=${from.email}`);
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from.email, name: from.name },
      subject: "Loomy - E-posta Dogrulama Kodu",
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] SendGrid hata (${res.status}): ${body}`);
    throw new Error(`SendGrid gonderim hatasi (${res.status}): ${body}`);
  }

  console.log(`[email] mail GONDERILDI -> ${to}`);
}
