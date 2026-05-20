import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { PaymobService } from './paymob.service';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Paymob')
@Controller('paymob')
export class PaymobController {
  constructor(private readonly paymobService: PaymobService) {}

  @ApiOperation({ summary: 'Paymob Webhook' })
  @ApiQuery({ name: 'hmac', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        obj: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed.' })
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() payload: any, @Query('hmac') hmac: string) {
    return this.paymobService.hook(payload, hmac);
  }
}
