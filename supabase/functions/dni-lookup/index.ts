import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dni } = await req.json();
    if (!dni || dni.length !== 8) {
      return new Response(JSON.stringify({ error: "DNI debe tener 8 dígitos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try free Peru DNI API
    const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
      headers: { "Accept": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({
        nombre: `${data.nombres || ""} ${data.apellidoPaterno || ""} ${data.apellidoMaterno || ""}`.trim(),
        nombres: data.nombres || "",
        apellido_paterno: data.apellidoPaterno || "",
        apellido_materno: data.apellidoMaterno || "",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fallback: try alternative API
    const res2 = await fetch(`https://apiperu.dev/api/dni/${dni}`, {
      headers: { "Accept": "application/json" },
    });

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.success && data2.data) {
        return new Response(JSON.stringify({
          nombre: `${data2.data.nombres || ""} ${data2.data.apellido_paterno || ""} ${data2.data.apellido_materno || ""}`.trim(),
          nombres: data2.data.nombres || "",
          apellido_paterno: data2.data.apellido_paterno || "",
          apellido_materno: data2.data.apellido_materno || "",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "No se pudo consultar el DNI" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
