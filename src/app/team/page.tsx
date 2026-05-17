import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { redirect } from "next/navigation";
import TeamDashboard from "./TeamDashboard";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.name) {
    redirect("/api/auth/signin");
  }

  // 1. Fetch the CURRENT USER'S full profile
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("name", session.user.name)
    .single();

  if (!currentUserProfile?.team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md text-center">
          <div className="text-6xl mb-4">⏱️</div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Free Agent</h1>
          <p className="text-slate-500 dark:text-slate-400">
            You haven't been drafted yet. Check back here once the admin finalizes the teams!
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch the Team's data, Roster, and Events
  const { data: team } = await supabase.from("teams").select("*").eq("id", currentUserProfile.team_id).single();
  const { data: roster } = await supabase.from("profiles").select("*").eq("team_id", currentUserProfile.team_id);
  const { data: events } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
  const { data: eventRosters } = await supabase.from("event_rosters").select("*").eq("team_id", currentUserProfile.team_id);

  // Safety check just in case the team was deleted!
  if (!team) {
    return <div className="p-8 text-center text-red-500 font-bold">Error: Your assigned team could not be found in the database.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      {/* @ts-ignore */}
      <TeamDashboard 
        initialTeam={team} 
        roster={roster || []} 
        events={events || []}
        initialEventRosters={eventRosters || []}
        currentUserProfile={currentUserProfile} 
      />
    </div>
  );
}