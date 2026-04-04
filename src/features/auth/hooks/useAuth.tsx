import { createContext, useState, useEffect, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/types";

interface AuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  roles: AppRole[];
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string, silent = false) => {
    if (!silent) setRolesLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      setRoles((data || []).map((r: any) => r.role as AppRole));
    } catch {
      if (!silent) {
        setRoles([]);
      }
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

  const isAdmin = roles.includes("admin");

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // loading is true until both auth AND roles are resolved
  const isLoading = loading || rolesLoading;

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading: isLoading,
    roles,
    isAdmin,
    signOut,
  }), [user, session, isLoading, roles, isAdmin, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
