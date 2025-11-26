import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { DeleteProductsDto } from './dto/delete-products.dto';

@ApiTags('Business')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Obter catálogo de produtos' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiQuery({ name: 'jid', required: false, description: 'JID do negócio (opcional)' })
  @ApiOkResponse({ description: 'Catálogo obtido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter catálogo' })
  async getCatalog(
    @Param('sessionId') sessionId: string,
    @Query('jid') jid?: string,
  ) {
    return this.businessService.getCatalog(sessionId, jid);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Obter coleções do catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiQuery({ name: 'jid', required: false, description: 'JID do negócio (opcional)' })
  @ApiOkResponse({ description: 'Coleções obtidas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter coleções' })
  async getCollections(
    @Param('sessionId') sessionId: string,
    @Query('jid') jid?: string,
  ) {
    return this.businessService.getCollections(sessionId, jid);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Obter detalhes de um pedido' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'orderId', description: 'ID do pedido' })
  @ApiQuery({ name: 'token', description: 'Token do pedido (base64)' })
  @ApiOkResponse({ description: 'Detalhes do pedido obtidos' })
  @ApiBadRequestResponse({ description: 'Erro ao obter pedido' })
  async getOrderDetails(
    @Param('sessionId') sessionId: string,
    @Param('orderId') orderId: string,
    @Query('token') token: string,
  ) {
    return this.businessService.getOrderDetails(sessionId, orderId, token);
  }

  @Post('products')
  @ApiOperation({ summary: 'Criar produto no catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateProductDto })
  @ApiOkResponse({ description: 'Produto criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar produto' })
  async createProduct(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.businessService.createProduct(sessionId, dto);
  }

  @Put('products/:productId')
  @ApiOperation({ summary: 'Atualizar produto do catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  @ApiBody({ type: CreateProductDto })
  @ApiOkResponse({ description: 'Produto atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar produto' })
  async updateProduct(
    @Param('sessionId') sessionId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.businessService.updateProduct(sessionId, productId, dto);
  }

  @Delete('products')
  @ApiOperation({ summary: 'Deletar produtos do catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: DeleteProductsDto })
  @ApiOkResponse({ description: 'Produtos deletados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao deletar produtos' })
  async deleteProducts(
    @Param('sessionId') sessionId: string,
    @Body() dto: DeleteProductsDto,
  ) {
    return this.businessService.deleteProduct(sessionId, dto.productIds);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil de negócio' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdateBusinessProfileDto })
  @ApiOkResponse({ description: 'Perfil atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar perfil' })
  async updateBusinessProfile(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.businessService.updateBusinessProfile(sessionId, dto);
  }
}
