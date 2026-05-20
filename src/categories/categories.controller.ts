import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { Category } from './entities/category.entity';
import { AuthRolesGuard } from 'src/auth/guards/auth-roles.guard';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { MessageResponse } from 'src/utils/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully.',
    type: Category,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Category name already exists.' })
  @ApiBody({ type: CreateCategoryDto })
  @Post()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  async create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @ApiOperation({ summary: 'Get all categories with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully.',
    type: [Category],
  })
  @Get()
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<Category[]> {
    return this.categoriesService.getAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully.',
    type: Category,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.getOne(id);
  }

  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully.',
    type: Category,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @ApiBody({ type: UpdateCategoryDto })
  @Patch(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully.',
    type: MessageResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<MessageResponse> {
    return this.categoriesService.delete(id);
  }
}
