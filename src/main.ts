import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.use(cookieParser());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const swagger = new DocumentBuilder()
    .setTitle('Ecommerce-Api')
    .setVersion('1.0')
    .build();
  const documentation = SwaggerModule.createDocument(app, swagger);
  //http:localhost:3000/swagger
  SwaggerModule.setup('swagger', app, documentation);
  app.enableCors({
    // origin: 'http://localhost:3000',
    // credentials: true, //
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
