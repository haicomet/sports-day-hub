import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.name) {
    redirect("/api/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("name", session.user.name)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-md border-l-4 border-red-500 max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500">You must be an admin to view the draft room.</p>
        </div>
      </div>
    );
  }

  // Fetch absolutely everything for God Mode
  const { data: teams } = await supabase.from("teams").select("*");
  const { data: players } = await supabase.from("profiles").select("*");
  const { data: events } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
  const { data: eventRosters } = await supabase.from("event_rosters").select("*"); // ALL rosters

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* @ts-ignore */}
      <AdminDashboard 
        teams={teams || []} 
        initialPlayers={players || []} 
        initialEvents={events || []}
        initialEventRosters={eventRosters || []}
      />
    </div>
  );
}