import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { supabase } from "../lib/supabase";
import NavUI from "./NavUI";

export default async function Navigation() {
  const session = await getServerSession(authOptions);
  let isAdmin = false;

  // If they are logged in, check if they are the admin
  if (session?.user?.name) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("name", session.user.name)
      .single();
    
    if (profile?.role === "admin") {
      isAdmin = true;
    }
  }

  // Pass both the session AND the admin status to the UI
  return <NavUI session={session} isAdmin={isAdmin} />;
}