import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { WASocket } from 'whaileys';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { DatabaseService } from '../../database/database.service';

/**
 * Result of session validation containing both session data and socket
 */
export interface ValidatedSession {
  sessionId: string;
  socket: WASocket;
  jid?: string;
  name?: string;
}

/**
 * Options for session validation
 */
export interface ValidationOptions {
  /** Whether to check database for session existence (default: false) */
  checkDatabase?: boolean;
  /** Whether to require user authentication (default: false) */
  requireAuth?: boolean;
}

/**
 * Centralized service for session and socket validation.
 * Provides consistent validation logic across all API modules.
 */
@Injectable()
export class SessionValidationService {
  constructor(
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
    private readonly prisma: DatabaseService,
  ) {}

  /**
   * Validates that a session exists and is connected.
   * Returns the validated session with socket.
   *
   * @param sessionId - The session ID to validate
   * @param options - Validation options
   * @returns ValidatedSession containing session info and socket
   * @throws NotFoundException if session doesn't exist
   * @throws BadRequestException if session is not connected
   */
  async validateSession(
    sessionId: string,
    options: ValidationOptions = {},
  ): Promise<ValidatedSession> {
    const { checkDatabase = false, requireAuth = false } = options;

    // Check database if requested
    if (checkDatabase) {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }
    }

    // Get socket
    const socket = this.whatsappService.getSocket(sessionId);

    if (!socket) {
      throw new BadRequestException(
        `Session ${sessionId} is not connected. Please connect first.`,
      );
    }

    // Check authentication if required
    if (requireAuth && !socket.user?.id) {
      throw new BadRequestException(
        `Session ${sessionId} is not authenticated`,
      );
    }

    return {
      sessionId,
      socket,
      jid: socket.user?.id,
      name: socket.user?.name,
    };
  }

  /**
   * Validates that a session exists and is connected.
   * Returns only the socket for simpler use cases.
   *
   * @param sessionId - The session ID to validate
   * @returns WASocket - The validated socket
   * @throws BadRequestException if session is not connected
   */
  getValidatedSocket(sessionId: string): WASocket {
    const socket = this.whatsappService.getSocket(sessionId);

    if (!socket) {
      throw new BadRequestException(
        `Session ${sessionId} is not connected. Please connect first.`,
      );
    }

    return socket;
  }

  /**
   * Validates session and ensures user is authenticated.
   * Returns the user's JID.
   *
   * @param sessionId - The session ID to validate
   * @returns The authenticated user's JID
   * @throws BadRequestException if not connected or not authenticated
   */
  async getAuthenticatedJid(sessionId: string): Promise<string> {
    const { socket } = await this.validateSession(sessionId);

    const jid = socket.user?.id;
    if (!jid) {
      throw new BadRequestException('User not authenticated');
    }

    return jid;
  }

  /**
   * Checks if a session is connected without throwing exceptions.
   *
   * @param sessionId - The session ID to check
   * @returns boolean indicating if session is connected
   */
  isSessionConnected(sessionId: string): boolean {
    const socket = this.whatsappService.getSocket(sessionId);
    return !!socket;
  }

  /**
   * Gets the socket if connected, returns undefined otherwise.
   * Does not throw exceptions.
   *
   * @param sessionId - The session ID
   * @returns WASocket or undefined
   */
  getSocketOrNull(sessionId: string): WASocket | undefined {
    return this.whatsappService.getSocket(sessionId);
  }
}
