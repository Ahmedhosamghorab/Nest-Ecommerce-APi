import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

/**
 * Service responsible for sending system emails, such as account verification.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a verification email to the user with a clickable link.
   * @param email - The recipient's email address.
   * @param link - The verification link containing the token.
   * @returns A promise that resolves when the email is sent.
   * @throws InternalServerErrorException on failure.
   */
  public async sendVerifyEmail(email: string, link: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `<noreply@nest.com>`,
        subject: 'Verify your account',
        template: 'verify-email',
        context: { link },
      });
    } catch (err) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
