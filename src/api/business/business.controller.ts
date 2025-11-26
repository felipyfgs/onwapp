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
import { UpdateProductDto } from './dto/update-product.dto';
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
  @ApiQuery({
    name: 'jid',
    required: false,
    description: 'JID do negócio (opcional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de produtos',
  })
  @ApiOkResponse({ description: 'Catálogo obtido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter catálogo' })
  async getCatalog(
    @Param('sessionId') sessionId: string,
    @Query('jid') jid?: string,
    @Query('limit') limit?: number,
  ) {
    return this.businessService.getCatalog(sessionId, jid, limit);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Obter coleções do catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiQuery({
    name: 'jid',
    required: false,
    description: 'JID do negócio (opcional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de coleções',
  })
  @ApiOkResponse({ description: 'Coleções obtidas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter coleções' })
  async getCollections(
    @Param('sessionId') sessionId: string,
    @Query('jid') jid?: string,
    @Query('limit') limit?: number,
  ) {
    return this.businessService.getCollections(sessionId, jid, limit);
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

  @Get('profile/:jid')
  @ApiOperation({ summary: 'Obter perfil de negócio de um contato' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do contato' })
  @ApiOkResponse({ description: 'Perfil obtido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter perfil' })
  async getBusinessProfile(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.businessService.getBusinessProfile(sessionId, jid);
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
    return this.businessService.createProduct(sessionId, {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      currency: dto.currency,
      url: dto.url,
      retailerId: dto.retailerId,
      isHidden: dto.isHidden,
      originCountryCode: dto.originCountryCode,
      images: dto.images,
    });
  }

  @Put('products/:productId')
  @ApiOperation({ summary: 'Atualizar produto do catálogo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ description: 'Produto atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar produto' })
  async updateProduct(
    @Param('sessionId') sessionId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.businessService.updateProduct(sessionId, productId, dto as any);
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
    return this.businessService.deleteProducts(sessionId, dto.productIds);
  }
}
