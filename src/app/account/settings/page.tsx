"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/providers/auth-provider";
import { updateProfile, changePassword } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
  const { customer, refresh, isAffiliate } = useAuth();

  const [firstName, setFirstName] = useState(customer?.first_name ?? "");
  const [lastName, setLastName] = useState(customer?.last_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!customer) return null;

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      await updateProfile({ firstName, lastName, phone });
      await refresh();
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.ok) {
        setPasswordMessage({ type: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: "Failed to change password. Check your current password." });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Failed to change password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and security.
        </p>
      </div>

      <form onSubmit={handleProfileSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(optional)"
              />
            </div>

            {isAffiliate && customer.affiliate_code && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label>Affiliate code</Label>
                    <p className="text-sm text-muted-foreground">{customer.affiliate_code}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Affiliate status</Label>
                    <p className="text-sm capitalize text-muted-foreground">{customer.affiliate_status}</p>
                  </div>
                </div>
              </>
            )}

            {profileMessage && (
              <p className={`text-sm ${profileMessage.type === "success" ? "text-green-600" : "text-destructive"}`}>
                {profileMessage.text}
              </p>
            )}

            <div>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-destructive"}`}>
                {passwordMessage.text}
              </p>
            )}

            <div>
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
