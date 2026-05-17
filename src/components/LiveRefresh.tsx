"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Listen to ALL changes on the public database
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log("Database changed! Refreshing UI...", payload);
        // This tells Next.js to seamlessly fetch fresh server data without losing scroll position!
        router.refresh(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // It renders absolutely nothing on the screen!
}