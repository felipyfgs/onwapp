import { WASocket, DisconnectReason } from 'whaileys';
import { RECONNECT_DELAYS, MAX_LOGOUT_ATTEMPTS } from '../whatsapp.types';

export function formatSessionId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

export function extractPhoneNumber(socket: WASocket): string | null {
  return socket.user?.id ? socket.user.id.split(':')[0] : null;
}

export function shouldReconnectSession(
  statusCode: DisconnectReason,
  logoutAttempts: number,
): boolean {
  // 401 = loggedOut - sessão invalidada, NÃO reconectar
  if (statusCode === DisconnectReason.loggedOut) {
    return false;
  }

  // 405 = methodNotAllowed - versão inválida, NÃO reconectar
  if ((statusCode as number) === 405) {
    return false;
  }

  // 408 = timedOut - reconectar
  // 411 = multideviceMismatch - reconectar
  // 428 = connectionClosed - reconectar
  // 440 = connectionReplaced - reconectar
  // 500 = badSession - reconectar com limite
  // 515 = restartRequired - reconectar

  const isBadSession = statusCode === DisconnectReason.badSession;

  // Para badSession, limitar tentativas
  if (isBadSession && logoutAttempts >= MAX_LOGOUT_ATTEMPTS) {
    return false;
  }

  return true;
}

export function getReconnectDelay(statusCode: DisconnectReason): number {
  return statusCode === DisconnectReason.restartRequired
    ? RECONNECT_DELAYS.RESTART_REQUIRED
    : RECONNECT_DELAYS.DEFAULT;
}

export function createSilentLogger(): Record<string, unknown> {
  const silentLogger: Record<string, unknown> = {
    level: 'silent',
    fatal: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    silent: () => {},
  };
  silentLogger.child = () => createSilentLogger();
  return silentLogger;
}
