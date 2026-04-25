import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dni } = await req.json();
    if (!dni || dni.length !== 8) {
      return new Response(JSON.stringify({ error: "DNI debe tener 8 dígitos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try apis.net.pe with token if available
    const apiToken = Deno.env.get("DNI_API_TOKEN");

    if (apiToken) {
      try {
        const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.nombres) {
            return new Response(JSON.stringify({
              nombre: `${data.nombres} ${data.apellidoPaterno || ""} ${data.apellidoMaterno || ""}`.trim(),
              nombres: data.nombres,
              apellido_paterno: data.apellidoPaterno || "",
              apellido_materno: data.apellidoMaterno || "",
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else {
          const txt = await res.text();
          console.error("apis.net.pe error:", res.status, txt);
        }
      } catch (e) {
        console.error("apis.net.pe fetch error:", (e as Error)?.message);
      }
    }

    // Fallback: try dniruc.com free endpoint
    try {
      const res2 = await fetch(`https://api.dniruc.com/eldni/api?dni=${dni}`, {
        headers: { Accept: "application/json" },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.nombres || data2.name) {
          const nombres = data2.nombres || data2.name || "";
          const apPaterno = data2.apellido_paterno || data2.apPat || "";
          const apMaterno = data2.apellido_materno || data2.apMat || "";
          return new Response(JSON.stringify({
            nombre: `${nombres} ${apPaterno} ${apMaterno}`.trim(),
            nombres,
            apellido_paterno: apPaterno,
            apellido_materno: apMaterno,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } else {
        const txt2 = await res2.text();
        console.error("dniruc.com error:", res2.status, txt2);
      }
    } catch (e) {
      console.error("dniruc.com fetch error:", (e as Error)?.message);
    }

    // Fallback 3: randomuser-style mock for development (remove in production)
    // If no API works, return a helpful error
    return new Response(JSON.stringify({
      error: "No se pudo consultar el DNI. Configure DNI_API_TOKEN en los secretos del proyecto (obténgalo gratis en apis.net.pe).",
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error)?.message || "Error";
    console.error("General error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
