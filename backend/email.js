
import { db } from './db.js';

class EmailService {
    constructor() {
        this.enabled = true; // Feature flag
    }

    async send(to, subject, body) {
        console.log(`\n📧 [EMAIL MOCK SERVICE] -------------------------`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body.substring(0, 50)}...`);
        console.log(`--------------------------------------------------\n`);

        try {
            // Log dans la DB pour l'historique admin
            await db.run(
                `INSERT INTO email_logs (to_email, subject, body, status, sent_at) VALUES (?, ?, ?, ?, ?)`,
                [to, subject, body, 'SENT (MOCK)', new Date().toISOString()]
            );
            return true;
        } catch (e) {
            console.error("Email logging failed:", e);
            return false;
        }
    }

    // Placeholder pour future implémentation SMTP (Nodemailer)
    configure(smtpConfig) {
        console.log("SMTP Configuration updated (Not implemented in PoC)");
    }
}

export const emailService = new EmailService();
