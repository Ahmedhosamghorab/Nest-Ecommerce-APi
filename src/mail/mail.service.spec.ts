import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { InternalServerErrorException } from '@nestjs/common';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerifyEmail', () => {
    it('should send an email successfully', async () => {
      await service.sendVerifyEmail('test@example.com', 'http://link.com');
      expect(mailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        template: 'verify-email',
      }));
    });

    it('should throw InternalServerErrorException on error', async () => {
      (mailerService.sendMail as jest.Mock).mockRejectedValue(new Error('SMTP error'));
      await expect(service.sendVerifyEmail('test@example.com', 'link')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
