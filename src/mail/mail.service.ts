import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, RequestTimeoutException } from '@nestjs/common';

/**
 * Service responsible for sending system emails, such as account verification.
 */
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a verification email to the user with a clickable link.
   * @param email - The recipient's email address.
   * @param link - The verification link containing the token.
   * @returns A promise that resolves when the email is sent, or a RequestTimeoutException on failure.
   */
  public async sendVerifyEmail(email: string, link: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `<noreply@nest.com>`,
        subject: 'Verify your account',
        template: 'verify-email',
        context: { link },
      });
    } catch (err: any) {
      console.log(err);
      return new RequestTimeoutException();
    }
  }
}
