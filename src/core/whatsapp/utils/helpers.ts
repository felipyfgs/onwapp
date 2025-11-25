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
  const isLoggedOut = statusCode === DisconnectReason.loggedOut;
  const isRestartRequired = statusCode === DisconnectReason.restartRequired;
  const isBadSession = statusCode === DisconnectReason.badSession;

  return (
    !isLoggedOut ||
    logoutAttempts < MAX_LOGOUT_ATTEMPTS ||
    isRestartRequired ||
    isBadSession
  );
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
