import Link from "next/link";
import { supabase } from "../lib/supabase";

// 🚨 FORCES NEXT.JS TO FETCH FRESH DATA EVERY SECOND 🚨
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch the teams (Ordered by score)
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("score", { ascending: false });

  // 2. Fetch the REAL events (Ordered chronologically by our sort_order)
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      
      {/* --- HERO HEADER --- */}
      <div className="text-center mb-16 mt-8">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-4 uppercase">
          Sports Day 2026
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          The ultimate showdown. Track the live score, check the schedule, and lead your team to victory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* --- LIVE SCOREBOARD --- */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            🏆 Live Leaderboard
          </h2>
          
          <div className="flex flex-col gap-4">
            {teams?.map((team, index) => (
              <div 
                key={team.id} 
                className="relative bg-white rounded-2xl shadow-md border border-slate-200 p-6 overflow-hidden flex items-center justify-between transition-transform hover:scale-[1.01]"
              >
                {/* Team Color Strip */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-4" 
                  style={{ backgroundColor: team.color.toLowerCase() }} 
                />
                
                <div className="flex items-center gap-6 pl-6">
                  <span className="text-4xl font-black text-slate-200">#{index + 1}</span>
                  <h3 className="text-2xl font-bold uppercase tracking-widest text-slate-800">{team.name}</h3>
                </div>
                
                <div className="text-right">
                  <span className="text-5xl font-black text-slate-900">{team.score || 0}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Points</span>
                </div>
              </div>
            ))}
          </div>
        </div>

       {/* --- UP NEXT SCHEDULE --- */}
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            ⏱️ Up Next
          </h2>
          
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <div className="space-y-6">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                    <p className="text-sm font-bold text-indigo-600 mb-1">{event.time_string}</p>
                    <h4 className="text-lg font-bold text-slate-900">{event.name}</h4>
                    {/* Replaced location with max players requirement */}
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1 font-medium">
                      👥 {event.max_players_per_team} Athletes per team
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic text-center py-4">No events scheduled yet.</p>
              )}
            </div>
            
            <Link 
              href="/events" 
              className="block w-full text-center mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
            >
              View Full Schedule
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}