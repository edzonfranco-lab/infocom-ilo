import { supabase } from "@/integrations/supabase/client";

/**
 * Send a notification to all staff members (users with moderator or admin role)
 */
export async function notifyAllStaff(params: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  excludeUserId?: string;
}) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["admin", "moderator"]);

  if (!roles || roles.length === 0) return;

  const userIds = [...new Set(roles.map(r => r.user_id))].filter(
    id => id !== params.excludeUserId
  );

  if (userIds.length === 0) return;

  const notifications = userIds.map(uid => ({
    user_id: uid,
    title: params.title,
    message: params.message,
    type: params.type || "info",
    link: params.link || null,
  }));

  await supabase.from("notifications").insert(notifications);
}
