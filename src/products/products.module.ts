import { BadRequestException, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProductImage } from './product_image.entity';
import { Category } from 'src/categories/entities/category.entity';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  controllers: [ProductsController],
  providers: [ProductService],
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, Category]),
    MulterModule.register({
      storage: diskStorage({
        destination: './images/products',
        filename: (_req, file, cb) => {
          const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
          const filename = `${prefix}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
          return cb(null, true);
        }
        cb(new BadRequestException('unsupported file format'), false);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
    UsersModule,
    AuthModule,
  ],
  exports: [ProductService],
})
export class ProductsModule {}
