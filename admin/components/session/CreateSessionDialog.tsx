"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateSessionDialog({
  open,
  onClose,
  onCreate,
}: CreateSessionDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Session name is required");
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError("Only letters, numbers, hyphens and underscores allowed");
      return;
    }

    onCreate(trimmed);
    setName("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                placeholder="my-session"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
