import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';
import { ProductCreate, ProductUpdate } from 'whaileys/lib/Types';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  async getCatalog(sessionId: string, jid?: string, limit?: number) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo catálogo${jid ? ` de ${jid}` : ''}`,
      );

      const catalog = await socket.getCatalog(jid, limit || 100);

      return catalog;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter catálogo: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter catálogo: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getCollections(sessionId: string, jid?: string, limit?: number) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo coleções${jid ? ` de ${jid}` : ''}`,
      );

      const collections = await socket.getCollections(jid, limit || 100);

      return collections;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter coleções: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter coleções: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getOrderDetails(
    sessionId: string,
    orderId: string,
    tokenBase64: string,
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Obtendo detalhes do pedido: ${orderId}`);

      const order = await socket.getOrderDetails(orderId, tokenBase64);

      return order;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter pedido: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter pedido: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async createProduct(sessionId: string, product: ProductCreate) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Criando produto: ${product.name}`);

      const result = await socket.productCreate(product);

      this.logger.log(`[${sessionId}] Produto criado: ${result?.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updateProduct(
    sessionId: string,
    productId: string,
    product: ProductUpdate,
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Atualizando produto: ${productId}`);

      const result = await socket.productUpdate(productId, product);

      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async deleteProducts(sessionId: string, productIds: string[]) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(
        `[${sessionId}] Deletando produtos: ${productIds.join(', ')}`,
      );

      const result = await socket.productDelete(productIds);

      return { success: true, deleted: result.deleted };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao deletar produtos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao deletar produtos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getBusinessProfile(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Obtendo perfil de negócio: ${jid}`);

      const profile = await socket.getBusinessProfile(jid);

      return profile;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter perfil: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter perfil: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
