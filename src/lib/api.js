import { supabase } from "./supabase.js";

export async function createSession(code, name, audienceGroups = null) {
  const groups =
    Array.isArray(audienceGroups) && audienceGroups.length > 0 ? audienceGroups : null;
  const { data, error } = await supabase
    .from("sessions")
    .insert({ code, name, status: "open", audience_groups: groups })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionByCode(code) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, responses(count)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function updateSessionStatus(id, status) {
  const { error } = await supabase
    .from("sessions")
    .update({ status, closed_at: status === "closed" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id) {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function submitResponse(sessionId, answers) {
  const { error } = await supabase
    .from("responses")
    .insert({ session_id: sessionId, answers });
  if (error) throw error;
}

export async function fetchResponses(sessionId) {
  const { data, error } = await supabase
    .from("responses")
    .select("id, answers, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export function subscribeToResponses(sessionId, onInsert) {
  const channel = supabase
    .channel(`responses-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "responses",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
