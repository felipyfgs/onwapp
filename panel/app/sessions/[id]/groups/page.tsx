'use client';

import { GroupList } from "@/components/group/group-list";
import { CreateGroupDialog } from "@/components/group/create-group-dialog";

export default function GroupsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grupos</h2>
          <p className="text-muted-foreground">Gerencie seus grupos do WhatsApp</p>
        </div>
        <CreateGroupDialog />
      </div>
      <GroupList />
    </div>
  );
}
