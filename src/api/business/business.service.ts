import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  GetCatalogDto,
  GetCollectionsDto,
  GetOrderDetailsDto,
  ProductCreateDto,
  ProductUpdateDto,
  ProductDeleteDto,
} from './dto';

@Injectable()
export class BusinessService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async getCatalog(sessionName: string, dto: GetCatalogDto) {
    try {
      return await this.whaileysService.getCatalog(sessionName, dto.jid, dto.limit);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get catalog',
      );
    }
  }

  async getCollections(sessionName: string, dto: GetCollectionsDto) {
    try {
      return await this.whaileysService.getCollections(
        sessionName,
        dto.jid,
        dto.limit,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get collections',
      );
    }
  }

  async getOrderDetails(sessionName: string, dto: GetOrderDetailsDto) {
    try {
      return await this.whaileysService.getOrderDetails(
        sessionName,
        dto.orderId,
        dto.tokenBase64,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get order details',
      );
    }
  }

  async createProduct(sessionName: string, dto: ProductCreateDto) {
    try {
      return await this.whaileysService.productCreate(sessionName, {
        name: dto.name,
        description: dto.description,
        currency: dto.currency,
        price: dto.price,
        url: dto.url,
        retailerId: dto.retailerId,
        originCountryCode: dto.originCountryCode,
        images: dto.images,
        isHidden: dto.isHidden,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create product',
      );
    }
  }

  async updateProduct(sessionName: string, dto: ProductUpdateDto) {
    try {
      return await this.whaileysService.productUpdate(sessionName, dto.productId, {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency,
        images: dto.images,
        url: dto.url,
        retailerId: dto.retailerId,
        isHidden: dto.isHidden,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update product',
      );
    }
  }

  async deleteProducts(sessionName: string, dto: ProductDeleteDto) {
    try {
      await this.whaileysService.productDelete(sessionName, dto.productIds);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete products',
      );
    }
  }
}
