export interface SessionEvent {
  event: string;
  sessionId: string;
  session: string;
  status: 'connected' | 'disconnected' | 'connecting';
  timestamp: string;
  data?: EventData;
}

export interface QRData {
  qrCode: string;
  qrBase64: string;
  pairingCode?: string;
}

export interface LoggedOutData {
  reason: string;
  onConnect: boolean;
}

export interface PairSuccessData {
  deviceId: string;
  businessName: string;
  platform: string;
}

export interface PairErrorData {
  id: string;
  businessName: string;
}

export interface ConnectFailureData {
  reason: string;
  message: string;
}

export type EventData =
  | QRData
  | LoggedOutData
  | PairSuccessData
  | PairErrorData
  | ConnectFailureData
  | Record<string, unknown>;

export type NatsEventCallback = (event: SessionEvent) => void;
