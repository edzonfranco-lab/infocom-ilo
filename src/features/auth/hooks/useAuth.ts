import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string, silent = false) => {
    if (!silent) setRolesLoading(true);

    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      setRoles((data || []).map((r: any) => r.role as AppRole));
    } finally {
      if (!silent) setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
          setRolesLoading(false);
        }
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setRolesLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshRolesSilently = () => {
      void fetchRoles(user.id, true);
    };

    const interval = window.setInterval(refreshRolesSilently, 30000);
    window.addEventListener("focus", refreshRolesSilently);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshRolesSilently();
    });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshRolesSilently);
      document.removeEventListener("visibilitychange", refreshRolesSilently);
    };
  }, [user?.id, fetchRoles]);

  const isAdmin = roles.includes("admin");

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // loading is true until both auth AND roles are resolved
  const isLoading = loading || rolesLoading;

  return { user, session, loading: isLoading, roles, isAdmin, signOut };
}
