"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check } from "lucide-react";

type ProfileData = {
  phone: string | null;
  acceptsMarketing: boolean;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/account/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPhone(data.profile.phone || "");
        setAcceptsMarketing(data.profile.acceptsMarketing || false);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone || null, acceptsMarketing }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    profile &&
    (phone !== (profile.phone || "") ||
      acceptsMarketing !== (profile.acceptsMarketing || false));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl text-stone-900">Settings</h2>
        <p className="text-stone-600 mt-1">
          Manage your account preferences.
        </p>
      </div>

      {/* Contact Preferences */}
      <div className="space-y-4">
        <h3 className="font-heading text-lg text-stone-900">
          Contact Preferences
        </h3>

        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-full bg-stone-100 animate-pulse rounded" />
            <div className="h-6 w-48 bg-stone-100 animate-pulse rounded" />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="For delivery updates"
                className="max-w-sm"
              />
              <p className="text-sm text-stone-500">
                We&apos;ll only use this for delivery-related updates.
              </p>
            </div>

            <div className="flex items-center justify-between max-w-sm py-4 border-t border-stone-100">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="cursor-pointer">
                  Newsletter
                </Label>
                <p className="text-sm text-stone-500">
                  Receive updates about new yarns and dye batches.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={acceptsMarketing}
                onCheckedChange={setAcceptsMarketing}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        )}
      </div>

      {/* Clerk Profile Management */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <h3 className="font-heading text-lg text-stone-900">
          Account Security
        </h3>
        <p className="text-sm text-stone-600">
          Manage your email, password, and connected accounts.
        </p>
        <div className="clerk-profile-wrapper">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-stone-200 rounded-lg",
                navbar: "hidden",
                pageScrollBox: "p-0",
                profileSection: "border-0",
              },
            }}
            routing="hash"
          />
        </div>
      </div>
    </div>
  );
}
