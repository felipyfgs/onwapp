export class SessionResponseDto {
  id: string;
  name: string;
  sessionId: string;
  status: string;
  qrCode?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
