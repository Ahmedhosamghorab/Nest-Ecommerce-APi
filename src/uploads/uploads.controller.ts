import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadsService } from './uploads.service';
import type { Response } from 'express';

@Controller('api/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images',
        filename: (req, file, cb) => {
          const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
          const filename = `${prefix}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
          return cb(null, true);
        }
        cb(new BadRequestException('unsupported file format'), false);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
  )
  public uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('no file provided');
    return {
      message: 'File uploaded successfully',
    };
  }

  //Get: ~/api/uploads/:image
  @Get(':image')
  public showUploadedImage(
    @Param('image') image: string,
    @Res() res: Response,
  ) {
    res.sendFile(image, { root: 'images' });
  }
}
