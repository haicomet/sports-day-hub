import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { redirect } from "next/navigation";
import TeamDashboard from "./TeamDashboard";

// Force live data fetch so the team name is always current
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  // 1. Kick them out if not logged in
  if (!session?.user?.name) {
    redirect("/api/auth/signin");
  }

  // 2. Fetch their profile to see which team they are on
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("name", session.user.name)
    .single();

  // 3. If they aren't drafted yet, show a waiting room
  if (!profile?.team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md text-center">
          <div className="text-6xl mb-4">⏱️</div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Free Agent</h1>
          <p className="text-slate-500 dark:text-slate-400">
            You haven't been drafted yet. Check back here once teams have been finalized!
          </p>
        </div>
      </div>
    );
  }

  // 4. Fetch the Team's data and the full Roster
  const { data: team } = await supabase.from("teams").select("*").eq("id", profile.team_id).single();
  const { data: roster } = await supabase.from("profiles").select("*").eq("team_id", profile.team_id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      {/* @ts-ignore */}
      <TeamDashboard initialTeam={team} roster={roster || []} currentUser={session.user.name} />
    </div>
  );
}