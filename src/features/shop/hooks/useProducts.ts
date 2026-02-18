import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";

interface UseProductsOptions {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("*, categories(*), brands(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (options.featured) query = query.eq("is_featured", true);
      if (options.isNew) query = query.eq("is_new", true);
      if (options.category) {
        // Get category id by slug
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", options.category).single();
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (options.brand) {
        const { data: br } = await supabase.from("brands").select("id").eq("slug", options.brand).single();
        if (br) query = query.eq("brand_id", br.id);
      }
      if (options.search) query = query.ilike("name", `%${options.search}%`);
      if (options.limit) query = query.limit(options.limit);

      const { data } = await query;
      setProducts((data || []).map((p: any) => ({
        ...p,
        category: p.categories,
        brand: p.brands,
      })) as Product[]);
      setLoading(false);
    };
    fetch();
  }, [options.category, options.brand, options.search, options.featured, options.isNew, options.limit]);

  return { products, loading };
}
