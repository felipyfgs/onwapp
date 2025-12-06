export interface Profile {
  jid: string
  pushName: string
  status?: string
  pictureUrl?: string
}

export interface ProfileResponse {
  profile: Profile
}

export interface SetNameRequest {
  name: string
}

export interface SetStatusRequest {
  status: string
}

export interface SetPictureRequest {
  image: string
}

export interface SetPictureResponse {
  pictureId: string
}
