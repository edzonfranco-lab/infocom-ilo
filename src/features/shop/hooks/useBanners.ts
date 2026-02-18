import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Banner } from "@/lib/types";

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setBanners((data || []) as Banner[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return { banners, loading };
}
