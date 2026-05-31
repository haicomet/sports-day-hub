import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  // Fetch all events sorted by your custom queue order
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true });

  // Fetch teams so we can display the winner's colors
  const { data: teams } = await supabase.from("teams").select("*");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      
      {/* HEADER */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mb-4">
          The Gauntlet
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          The official sequence of events. No strict times—we move when the Commissioner says we move.
        </p>
      </div>

      {/* TIMELINE */}
      <div className="relative border-l-4 border-slate-200 dark:border-slate-700 ml-4 md:ml-8 space-y-8 pb-12">
        {events?.map((event, index) => {
          const winner = teams?.find(t => t.id === event.winner_team_id);
          const isFinished = !!winner;

          return (
            <div key={event.id} className="relative pl-8 md:pl-12">
              
              {/* TIMELINE DOT */}
              <div className={`absolute -left-[14px] top-1 h-6 w-6 rounded-full border-4 border-slate-50 dark:border-slate-900 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`} />
              
              <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-md border transition-all ${isFinished ? 'border-emerald-200 dark:border-emerald-900/50 opacity-80' : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'}`}>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    {/* PHASE / TIME */}
                    <span className={`text-sm font-bold tracking-widest uppercase mb-2 block ${isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {isFinished ? "✓ Completed" : event.time_string}
                    </span>
                    
                    {/* EVENT NAME */}
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
                      {index + 1}. {event.name}
                    </h2>
                    
                    {/* REQUIREMENTS */}
                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                      👥 {event.max_players_per_team} Athletes per team required
                    </p>
                  </div>

                  {/* WINNER BADGE */}
                  {winner && (
                    <div className="mt-4 md:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border bg-opacity-10 dark:bg-opacity-20" style={{ color: winner.color.toLowerCase(), borderColor: winner.color.toLowerCase(), backgroundColor: winner.color.toLowerCase() }}>
                      <span className="text-2xl">🏆</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Winner</span>
                        <span className="font-black text-lg leading-tight">{winner.name}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {!events || events.length === 0 ? (
          <p className="pl-8 text-slate-500 italic">The schedule is currently being finalized. Check back soon!</p>
        ) : null}

      </div>
    </div>
  );
}