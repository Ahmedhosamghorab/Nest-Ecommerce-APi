import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { MailService } from '../src/mail/mail.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mailService: MailService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendVerifyEmail: jest.fn().mockResolvedValue(null),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    mailService = moduleFixture.get<MailService>(MailService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/auth/register (POST)', () => {
    it('should register a new user', () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      return request(app.getHttpServer())
        .post('/users/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password123!',
          username: 'testuser',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('verification link has been sent to your email');
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/users/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });
});
