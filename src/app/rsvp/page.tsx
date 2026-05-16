import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function RSVPPage() {
  // 1. Check if the user is logged in
  const session = await getServerSession(authOptions);

  // 2. If logged in, let's see if they have been assigned a team yet
  let teamName = "Pending Draft...";
  if (session?.user?.name) {
    const { data } = await supabase
      .from("profiles")
      .select("teams(name)")
      .eq("name", session.user.name)
      .single();
    
    // 1. Define the exact shape of the data we expect from Supabase
    type ProfileData = {
      teams: { name: string } | null;
    };

    // 2. Safely cast the data so TypeScript knows exactly what it is
    const profile = data as unknown as ProfileData;

    if (profile?.teams?.name) {
      teamName = profile.teams.name;
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">
          Sports Day 2026
        </h1>
        
        {!session ? (
          // --- NOT LOGGED IN VIEW ---
          <>
            <p className="text-slate-500 mb-8 mt-4">
              You need to authenticate to lock in your RSVP and get drafted onto a team.
            </p>
            <Link 
              href="/api/auth/signin"
              className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Login to RSVP
            </Link>
          </>
        ) : (
          // --- LOGGED IN VIEW (RSVP CONFIRMED) ---
          <>
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-4 mb-8 mt-4">
              <p className="font-bold text-lg">🎉 You are on the roster!</p>
              <p className="text-sm">Your profile has been created.</p>
            </div>

            <div className="text-left bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Athlete Name</p>
              <p className="text-xl font-bold text-slate-800 mb-4">{session.user?.name}</p>

              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Team Assignment</p>
              <p className="text-xl font-bold text-indigo-600">{teamName}</p>
            </div>

            <Link 
              href="/"
              className="mt-8 w-full block bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}