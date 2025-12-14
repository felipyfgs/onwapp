"use client";

import { BusinessProfile } from "@/lib/api";
import { Label } from "@/components/ui/label";

interface BusinessProfileCardProps {
  profile: BusinessProfile;
}

export function BusinessProfileCard({ profile }: BusinessProfileCardProps) {
  return (
    <div className="space-y-2 pt-2">
      <Label className="uppercase text-xs text-muted-foreground font-bold">Business Info</Label>
      <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
        {profile.description && (
          <div>
            <span className="font-medium">Description:</span>
            <p className="text-muted-foreground">{profile.description}</p>
          </div>
        )}
        {profile.category && (
          <div className="flex justify-between">
            <span className="font-medium">Category:</span>
            <span>{profile.category}</span>
          </div>
        )}
        {profile.email && (
          <div className="flex justify-between">
            <span className="font-medium">Email:</span>
            <span>{profile.email}</span>
          </div>
        )}
        {profile.website && Array.isArray(profile.website) && profile.website.length > 0 && (
          <div>
            <span className="font-medium">Website:</span>
            <ul className="list-disc pl-4 text-muted-foreground">
              {profile.website.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
