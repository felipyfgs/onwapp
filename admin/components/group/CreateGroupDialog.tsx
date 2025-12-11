"use client";

import { useState } from "react";
import { createGroup } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface CreateGroupDialogProps {
  sessionId: string;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateGroupDialog({ sessionId, onCreated, trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !sessionId) return;
    setCreating(true);
    try {
      await createGroup(sessionId, name, []);
      setOpen(false);
      setName("");
      onCreated?.();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={creating || !name} className="w-full">
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
