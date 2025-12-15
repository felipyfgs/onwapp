'use client';

import { ProfileSettings } from "@/components/profile/profile-settings";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold">Perfil</h2>
        <p className="text-muted-foreground">Gerencie suas informações de perfil</p>
      </div>
      <ProfileSettings />
    </div>
  );
}
