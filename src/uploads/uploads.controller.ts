import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('api/uploads')
export class UploadsController {
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully.',
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('no file provided');
    return {
      message: 'File uploaded successfully',
    };
  }

  @ApiOperation({ summary: 'Get an uploaded image' })
  @ApiParam({ name: 'image', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image returned.' })
  @Get(':image')
  public showUploadedImage(
    @Param('image') image: string,
    @Res() res: Response,
  ) {
    res.sendFile(image, { root: 'images' });
  }
}
