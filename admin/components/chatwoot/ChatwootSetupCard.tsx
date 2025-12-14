"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

interface ChatwootSetupCardProps {
  onSetup: () => void;
}

export function ChatwootSetupCard({ onSetup }: ChatwootSetupCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Chatwoot</CardTitle>
        <CardDescription>
          Connect this session to your Chatwoot inbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onSetup}>
          <Settings className="mr-2 h-4 w-4" />
          Setup Integration
        </Button>
      </CardContent>
    </Card>
  );
}
