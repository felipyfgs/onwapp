export interface Contact {
  jid: string
  name?: string
  pushName?: string
  businessName?: string
  found: boolean
}

export interface CheckPhoneRequest {
  phones: string[]
}

export interface CheckPhoneResult {
  phone: string
  isRegistered: boolean
  jid: string
}

export interface BlocklistResponse {
  blocklist: string[]
}

export interface UpdateBlocklistRequest {
  phones: string[]
  action: "block" | "unblock"
}
