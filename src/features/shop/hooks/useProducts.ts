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
  sort?: string;
  priceMin?: number;
  priceMax?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Determine sort
      let orderCol = "created_at";
      let orderAsc = false;
      switch (options.sort) {
        case "name-asc": orderCol = "name"; orderAsc = true; break;
        case "name-desc": orderCol = "name"; orderAsc = false; break;
        case "price-asc": orderCol = "price"; orderAsc = true; break;
        case "price-desc": orderCol = "price"; orderAsc = false; break;
        case "date-desc": orderCol = "created_at"; orderAsc = false; break;
        case "position": orderCol = "created_at"; orderAsc = false; break;
        default: break;
      }

      let query = supabase
        .from("products")
        .select("*, categories(*), brands(*)")
        .eq("is_active", true)
        .order(orderCol, { ascending: orderAsc });

      if (options.featured) query = query.eq("is_featured", true);
      if (options.isNew) query = query.eq("is_new", true);
      if (options.category) {
        // Get the selected category and all its children for hierarchy filtering
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", options.category).single();
        if (cat) {
          // Check if this category has children
          const { data: children } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
          if (children && children.length > 0) {
            // Parent category: include parent + all children
            const allIds = [cat.id, ...children.map(c => c.id)];
            query = query.in("category_id", allIds);
          } else {
            query = query.eq("category_id", cat.id);
          }
        }
      }
      if (options.brand) {
        const { data: br } = await supabase.from("brands").select("id").eq("slug", options.brand).single();
        if (br) query = query.eq("brand_id", br.id);
      }
      if (options.search) query = query.ilike("name", `%${options.search}%`);
      if (options.priceMin !== undefined) query = query.gte("price", options.priceMin);
      if (options.priceMax !== undefined) query = query.lte("price", options.priceMax);
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
  }, [options.category, options.brand, options.search, options.featured, options.isNew, options.limit, options.sort, options.priceMin, options.priceMax]);

  return { products, loading };
}
