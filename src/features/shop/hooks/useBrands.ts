import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Brand } from "@/lib/types";

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setBrands((data || []) as Brand[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return { brands, loading };
}
