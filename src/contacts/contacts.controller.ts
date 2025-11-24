import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ValidateNumberDto } from './dto/validate-number.dto';
import { ValidateNumberResponseDto } from './dto/validate-number-response.dto';
import { BusinessProfileResponseDto } from './dto/business-profile-response.dto';

@ApiTags('Contacts')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Validar se números existem no WhatsApp',
    description:
      'Verifica se um ou mais números de telefone estão registrados no WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: ValidateNumberDto })
  @ApiOkResponse({
    description: 'Validação realizada com sucesso',
    type: ValidateNumberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async validateNumbers(
    @Param('sessionId') sessionId: string,
    @Body() dto: ValidateNumberDto,
  ): Promise<ValidateNumberResponseDto> {
    return this.contactsService.validateNumbers(sessionId, dto);
  }

  @Get('business/:jid')
  @ApiOperation({
    summary: 'Obter perfil de negócio',
    description:
      'Retorna informações do perfil de negócio de um contato (descrição, categoria, etc.)',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({
    name: 'jid',
    description: 'JID do contato (ex: 5511999999999@s.whatsapp.net)',
  })
  @ApiOkResponse({
    description: 'Perfil de negócio retornado com sucesso',
    type: BusinessProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Perfil de negócio não encontrado ou sessão não encontrada',
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async getBusinessProfile(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ): Promise<BusinessProfileResponseDto | null> {
    return this.contactsService.getBusinessProfile(sessionId, jid);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar contatos',
    description: 'Retorna a lista de contatos da sessão (do cache de eventos)',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Contatos retornados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          notify: { type: 'string' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  listContacts(@Param('sessionId') sessionId: string): Promise<any[]> {
    return this.contactsService.listContacts(sessionId);
  }
}
