import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (data) {
        const parents = data.filter((c: any) => !c.parent_id).map((c: any) => ({
          ...c,
          children: data.filter((sub: any) => sub.parent_id === c.id),
        }));
        setCategories(parents as Category[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { categories, loading };
}
