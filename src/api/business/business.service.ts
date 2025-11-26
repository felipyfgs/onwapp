import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  async getCatalog(sessionId: string, jid?: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Obtendo catálogo${jid ? ` de ${jid}` : ''}`);

      const catalog = await socket.getCatalog({ jid, limit: 100 });

      return { catalog };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter catálogo: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao obter catálogo: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async getCollections(sessionId: string, jid?: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Obtendo coleções${jid ? ` de ${jid}` : ''}`);

      const collections = await socket.getCollections(jid);

      return { collections };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter coleções: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao obter coleções: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async getOrderDetails(sessionId: string, orderId: string, tokenBase64: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Obtendo detalhes do pedido: ${orderId}`);

      const order = await socket.getOrderDetails(orderId, tokenBase64);

      return order;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter pedido: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao obter pedido: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async createProduct(
    sessionId: string,
    product: {
      name: string;
      description?: string;
      price?: number;
      currency?: string;
      url?: string;
      retailerId?: string;
      images?: Array<{ url: string }>;
    },
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Criando produto: ${product.name}`);

      const result = await socket.productCreate(product);

      this.logger.log(`[${sessionId}] Produto criado: ${result?.productId}`);
      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async updateProduct(
    sessionId: string,
    productId: string,
    product: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      url?: string;
      images?: Array<{ url: string }>;
    },
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Atualizando produto: ${productId}`);

      const result = await socket.productUpdate(productId, product);

      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async deleteProduct(sessionId: string, productIds: string[]) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Deletando produtos: ${productIds.join(', ')}`);

      const result = await socket.productDelete(productIds);

      return { success: true, deleted: result };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao deletar produtos: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao deletar produtos: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async updateBusinessProfile(
    sessionId: string,
    profile: {
      description?: string;
      email?: string;
      website?: string[];
      category?: string;
      address?: string;
    },
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Atualizando perfil de negócio`);

      await socket.updateBussinesProfile(profile);

      return { success: true, message: 'Perfil de negócio atualizado' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }
}
