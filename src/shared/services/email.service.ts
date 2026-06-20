import { EmailProvider } from '@providers/email.provider.js';
import { PasswordResetEmailTemplate } from '@templates/emails/password-reset.template.js';
import { VerificationTokenEmailTemplate } from '@templates/emails/verification-token.template.js';
import { WelcomeEmailTemplate } from '@templates/emails/welcome.template.js';
import { OrderInvoiceEmailTemplate } from '@templates/emails/order-invoice.template.js';
import { RentalApprovalEmailTemplate } from '@templates/emails/rental-approval.template.js';
import { RentalRejectionEmailTemplate } from '@templates/emails/rental-rejection.template.js';
import { MovieReminderEmailTemplate, type MovieReminderType } from '@templates/emails/movie-reminder.template.js';

class EmailService {
    private get provider() {
        return EmailProvider.getInstance();
    }

    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        return this.provider.sendMail(to, subject, html);
    }

    async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        const subject = `¡Bienvenido a Cineflix!`;
        const html = WelcomeEmailTemplate(name);
        return this.provider.sendMail(to, subject, html);
    }

    async sendVerificationCode(to: string, token: string, name: string): Promise<boolean> {
        const subject = `Código de Verificación`;
        const html = VerificationTokenEmailTemplate(token, name);
        return this.provider.sendMail(to, subject, html);
    }

    async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
        const subject = `Restablecimiento de Contraseña`;
        const html = PasswordResetEmailTemplate(resetToken);
        return this.provider.sendMail(to, subject, html);
    }

    async sendOrderInvoiceEmail(to: string, orderId: number, qrCode: string): Promise<boolean> {
        const subject = `Factura de Compra #${orderId} - Cineflix`;
        const html = OrderInvoiceEmailTemplate(orderId, qrCode);
        return this.provider.sendMail(to, subject, html);
    }

    async sendRentalApproval(
        to: string,
        eventName: string,
        roomName: string,
        cinemaName: string,
        price: number,
        requestId: number,
    ): Promise<boolean> {
        const subject = `Solicitud de alquiler aprobada: ${eventName}`;
        const html = RentalApprovalEmailTemplate(eventName, roomName, cinemaName, price, requestId);
        return this.provider.sendMail(to, subject, html);
    }

    async sendRentalRejection(to: string, eventName: string, requestId: number): Promise<boolean> {
        const subject = `Solicitud de alquiler rechazada: ${eventName}`;
        const html = RentalRejectionEmailTemplate(eventName, requestId);
        return this.provider.sendMail(to, subject, html);
    }

    async sendMovieReminderEmail(
        to: string,
        name: string,
        movieTitle: string,
        releaseDate: string,
        reminderType: MovieReminderType,
        posterUrl?: string,
    ): Promise<boolean> {
        const subjectMap: Record<MovieReminderType, string> = {
            presale: `🎟️ ¡Preventa disponible! ${movieTitle} - Cineflix`,
            '3_weeks': `🎬 Faltan 3 semanas: ${movieTitle} - Cineflix`,
            '2_weeks': `🎬 ¡Casi llega! ${movieTitle} se estrena en 2 semanas - Cineflix`,
            '1_week': `⏳ ¡Una semana para el estreno de ${movieTitle}! - Cineflix`,
            '2_days': `🚨 ¡Solo 2 días! ${movieTitle} llega el viernes - Cineflix`,
        };

        const subject = subjectMap[reminderType];
        const html = MovieReminderEmailTemplate(name, movieTitle, releaseDate, reminderType, posterUrl);
        return this.provider.sendMail(to, subject, html);
    }
}

export const emailService = new EmailService();
