import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompanyInfo {
  id: string;
  section_key: string;
  title: string;
  content: string | null;
  is_visible: boolean;
  sort_order: number;
}

interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  city: string | null;
  department: string | null;
  gmaps_url: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
  sort_order: number;
}

interface CompanyCertification {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  issued_by: string | null;
  year: number | null;
  is_active: boolean;
  sort_order: number;
}

interface CompanyTeamMember {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

export function useCompanyInfo() {
  const [info, setInfo] = useState<CompanyInfo[]>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [certifications, setCertifications] = useState<CompanyCertification[]>([]);
  const [team, setTeam] = useState<CompanyTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [infoRes, locRes, certRes, teamRes] = await Promise.all([
        supabase.from("company_info").select("*").order("sort_order"),
        supabase.from("company_locations").select("*").order("sort_order"),
        supabase.from("company_certifications").select("*").order("sort_order"),
        supabase.from("company_team").select("*").order("sort_order"),
      ]);
      setInfo((infoRes.data || []) as CompanyInfo[]);
      setLocations((locRes.data || []) as CompanyLocation[]);
      setCertifications((certRes.data || []) as CompanyCertification[]);
      setTeam((teamRes.data || []) as CompanyTeamMember[]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getSection = (key: string) => info.find(i => i.section_key === key);

  return { info, locations, certifications, team, loading, getSection };
}

export type { CompanyInfo, CompanyLocation, CompanyCertification, CompanyTeamMember };
