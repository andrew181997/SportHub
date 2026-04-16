import nodemailer from "nodemailer";

function requireSmtpConfig(): { user: string; pass: string } {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user?.trim() || !pass) {
    throw new Error(
      "SMTP не настроен: задайте SMTP_USER и SMTP_PASSWORD в переменных окружения"
    );
  }
  return { user: user.trim(), pass };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.yandex.ru",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationCode(to: string, code: string) {
  const { user: smtpUser } = requireSmtpConfig();

  await transporter.sendMail({
    from: `"SportHub" <${smtpUser}>`,
    to,
    subject: "Код подтверждения SportHub",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Подтверждение email</h2>
        <p>Ваш код подтверждения:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                    text-align: center; padding: 20px; background: #f4f4f5;
                    border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #71717a;">Код действителен 10 минут.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetLink(to: string, token: string) {
  const { user: smtpUser } = requireSmtpConfig();
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"SportHub" <${smtpUser}>`,
    to,
    subject: "Сброс пароля SportHub",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Сброс пароля</h2>
        <p>Вы запросили сброс пароля. Нажмите на кнопку ниже:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px;
           background: #1d4ed8; color: white; text-decoration: none;
           border-radius: 8px; margin: 16px 0;">
          Сбросить пароль
        </a>
        <p style="color: #71717a;">Ссылка действительна 30 минут.</p>
        <p style="color: #71717a; font-size: 12px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
      </div>
    `,
  });
}

export async function sendNotification(to: string, subject: string, html: string) {
  const { user: smtpUser } = requireSmtpConfig();
  await transporter.sendMail({
    from: `"SportHub" <${smtpUser}>`,
    to,
    subject,
    html,
  });
}
