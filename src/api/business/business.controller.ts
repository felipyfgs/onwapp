import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BusinessService } from './business.service';
import {
  GetCatalogDto,
  GetCollectionsDto,
  GetOrderDetailsDto,
  ProductCreateDto,
  ProductUpdateDto,
  ProductDeleteDto,
  SuccessResponseDto,
} from './dto';

@ApiTags('Business')
@ApiSecurity('apikey')
@Controller('sessions/:session/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Get product catalog',
    description: 'Retrieve product catalog from a business account',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Catalog retrieved' })
  @ApiResponse({ status: 400, description: 'Failed to get catalog' })
  async getCatalog(
    @Param('session') session: string,
    @Query() dto: GetCatalogDto,
  ) {
    return this.businessService.getCatalog(session, dto);
  }

  @Get('collections')
  @ApiOperation({
    summary: 'Get product collections',
    description: 'Retrieve product collections from a business account',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Collections retrieved' })
  @ApiResponse({ status: 400, description: 'Failed to get collections' })
  async getCollections(
    @Param('session') session: string,
    @Query() dto: GetCollectionsDto,
  ) {
    return this.businessService.getCollections(session, dto);
  }

  @Post('order-details')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieve details of a specific order',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  @ApiResponse({ status: 400, description: 'Failed to get order details' })
  async getOrderDetails(
    @Param('session') session: string,
    @Body() dto: GetOrderDetailsDto,
  ) {
    return this.businessService.getOrderDetails(session, dto);
  }

  @Post('products')
  @ApiOperation({
    summary: 'Create a product',
    description: 'Create a new product in the catalog',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Failed to create product' })
  async createProduct(
    @Param('session') session: string,
    @Body() dto: ProductCreateDto,
  ) {
    return this.businessService.createProduct(session, dto);
  }

  @Put('products')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Update an existing product in the catalog',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 400, description: 'Failed to update product' })
  async updateProduct(
    @Param('session') session: string,
    @Body() dto: ProductUpdateDto,
  ) {
    return this.businessService.updateProduct(session, dto);
  }

  @Delete('products')
  @ApiOperation({
    summary: 'Delete products',
    description: 'Delete one or more products from the catalog',
  })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Products deleted',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to delete products' })
  async deleteProducts(
    @Param('session') session: string,
    @Body() dto: ProductDeleteDto,
  ): Promise<SuccessResponseDto> {
    await this.businessService.deleteProducts(session, dto);
    return { success: true };
  }
}
