import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // 1. Kick them out if not logged in
  if (!session?.user?.name) {
    redirect("/api/auth/signin");
  }

  // 2. Fetch their profile to check their role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("name", session.user.name)
    .single();

  // 3. Kick them out if they aren't an admin
  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-md border-l-4 border-red-500 max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500">You must be the commissioner to view the draft room.</p>
        </div>
      </div>
    );
  }

  // 4. If they ARE an admin, fetch the draft & event data
  const { data: teams } = await supabase.from("teams").select("*");
  const { data: players } = await supabase.from("profiles").select("*");
  const { data: events } = await supabase.from("events").select("*").order("sort_order", { ascending: true });

  // 5. Pass it to our interactive client component
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* @ts-ignore */}
      <AdminDashboard 
        teams={teams || []} 
        initialPlayers={players || []} 
        initialEvents={events || []} 
      />
    </div>
  );
}