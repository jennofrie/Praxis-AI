"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { Profile, ProfilePreferences } from "@/lib/supabase";

export interface SaveResult {
  success: boolean;
  error?: string;
}

export function useProfileSettings() {
  const supabase = createBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && mounted) {
        setProfile(data as Profile);
      }
      if (mounted) setIsLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [supabase]);

  const saveOrganizationDetails = useCallback(async (details: Record<string, string>): Promise<SaveResult> => {
    if (!profile) return { success: false, error: "Not loaded" };
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ organization_details: details })
        .eq("id", profile.id);

      if (error) return { success: false, error: error.message };
      setProfile(prev => prev ? { ...prev, organization_details: details } : prev);
      return { success: true };
    } finally {
      setIsSaving(false);
    }
  }, [profile, supabase]);

  const savePreferences = useCallback(async (partial: Partial<ProfilePreferences>): Promise<SaveResult> => {
    if (!profile) return { success: false, error: "Not loaded" };
    setIsSaving(true);
    try {
      const merged = { ...(profile.preferences || {}), ...partial };
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: merged })
        .eq("id", profile.id);

      if (error) return { success: false, error: error.message };
      setProfile(prev => prev ? { ...prev, preferences: merged } : prev);
      return { success: true };
    } finally {
      setIsSaving(false);
    }
  }, [profile, supabase]);

  return { profile, isLoading, isSaving, saveOrganizationDetails, savePreferences };
}
