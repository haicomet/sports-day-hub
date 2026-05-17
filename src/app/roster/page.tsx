import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { redirect } from "next/navigation";
import RosterUI from "./RosterUI";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.name) {
    redirect("/api/auth/signin");
  }

  // Fetch the current user so we know what permissions to give them
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("name", session.user.name)
    .single();

  // Fetch all players and teams
  const { data: players } = await supabase.from("profiles").select("*").order("name");
  const { data: teams } = await supabase.from("teams").select("*");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <RosterUI 
        initialPlayers={players || []} 
        teams={teams || []} 
        currentUser={currentUserProfile} 
      />
    </div>
  );
}