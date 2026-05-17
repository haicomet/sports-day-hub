"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; score: number };
type Player = { id: string; name: string; team_id: string | null; role: string };
type Event = { id: string; name: string; time_string: string; winner_team_id: string | null };

export default function AdminDashboard({ teams, initialPlayers, initialEvents }: { teams: Team[], initialPlayers: Player[], initialEvents: Event[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [teamsState, setTeamsState] = useState<Team[]>(teams);
  const [eventsState, setEventsState] = useState<Event[]>(initialEvents);
  
  const [customScores, setCustomScores] = useState<Record<string, string>>({});
  const [eventPoints, setEventPoints] = useState<Record<string, string>>({});
  const [isDrafting, setIsDrafting] = useState(false);

  // --- LIVE SCORE CONTROLLER ---
  const updateScore = async (teamId: string, delta: number) => {
    const team = teamsState.find(t => t.id === teamId);
    if (!team) return;
    const newScore = (team.score || 0) + delta;

    setTeamsState(teamsState.map(t => t.id === teamId ? { ...t, score: newScore } : t));
    await supabase.from("teams").update({ score: newScore }).eq("id", teamId);
    
    setCustomScores({ ...customScores, [teamId]: "" });
  };

  // --- EVENT RESULTS CONTROLLER ---
  const lockEventResult = async (eventId: string, winningTeamId: string) => {
    const pointsToAward = parseInt(eventPoints[eventId] || "0", 10);

    setEventsState(eventsState.map(e => e.id === eventId ? { ...e, winner_team_id: winningTeamId } : e));
    await supabase.from("events").update({ winner_team_id: winningTeamId }).eq("id", eventId);

    if (pointsToAward > 0) {
      updateScore(winningTeamId, pointsToAward);
    }
    
    setEventPoints({ ...eventPoints, [eventId]: "" });
  };

  // --- THE DRAFT RANDOMIZER ---
  const randomizeTeams = async () => {
    setIsDrafting(true);
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const updatedPlayers = shuffled.map((player, index) => ({ ...player, team_id: teams[index % teams.length].id }));
    setPlayers(updatedPlayers);
    for (const player of updatedPlayers) {
      await supabase.from("profiles").update({ team_id: player.team_id }).eq("id", player.id);
    }
    setIsDrafting(false);
  };

  const movePlayer = async (playerId: string, newTeamId: string) => {
    setPlayers(players.map(p => p.id === playerId ? { ...p, team_id: newTeamId } : p));
    await supabase.from("profiles").update({ team_id: newTeamId }).eq("id", playerId);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      
      {/* 1. LIVE SCORE CONTROLLER */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">🕹️ Live Score Override</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamsState.map((team) => (
            <div key={team.id} className="border-2 rounded-xl p-4 flex flex-col items-center relative overflow-hidden" style={{ borderColor: team.color.toLowerCase() }}>
              <div className="absolute top-0 w-full h-2 left-0" style={{ backgroundColor: team.color.toLowerCase() }} />
              <h3 className="text-xl font-black text-slate-800 uppercase mt-2">{team.name}</h3>
              <p className="text-5xl font-black text-slate-900 my-4">{team.score || 0}</p>
              
              <div className="flex gap-2 w-full mb-2">
                <button onClick={() => updateScore(team.id, -1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg">-1</button>
                <button onClick={() => updateScore(team.id, 1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg">+1</button>
              </div>
              
              <div className="flex gap-2 w-full">
                {/* 🚨 FIXED INPUT COLOR 🚨 */}
                <input 
                  type="number" 
                  placeholder="Pts"
                  value={customScores[team.id] || ""}
                  onChange={(e) => setCustomScores({...customScores, [team.id]: e.target.value})}
                  className="w-16 border border-slate-300 rounded-lg text-center text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={() => updateScore(team.id, parseInt(customScores[team.id] || "0", 10))}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. EVENT RESULTS CONTROLLER */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">🏆 Log Event Results</h2>
        </div>
        <div className="p-6 space-y-4">
          {eventsState.map(event => (
            <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
              <div>
                <p className="text-sm font-bold text-indigo-600">{event.time_string}</p>
                <h4 className="text-lg font-bold text-slate-900">{event.name}</h4>
              </div>
              
              <div className="flex items-center gap-2">
                {event.winner_team_id ? (
                  <div className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    ✅ Winner Locked: {teams.find(t => t.id === event.winner_team_id)?.name}
                  </div>
                ) : (
                  <>
                    {/* 🚨 FIXED INPUT COLOR 🚨 */}
                    <input 
                      type="number" 
                      placeholder="Points" 
                      value={eventPoints[event.id] || ""}
                      onChange={(e) => setEventPoints({...eventPoints, [event.id]: e.target.value})}
                      className="w-24 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {/* 🚨 FIXED DROPDOWN COLOR 🚨 */}
                    <select 
                      onChange={(e) => lockEventResult(event.id, e.target.value)}
                      defaultValue=""
                      className="border border-slate-300 rounded-lg text-sm bg-white text-slate-900 font-medium cursor-pointer px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" disabled>Select Winner...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. THE DRAFT ROOM */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">The Draft Room</h2>
          <button 
            onClick={randomizeTeams}
            disabled={isDrafting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 transition-all"
          >
            {isDrafting ? "Drafting..." : "🎲 Randomize Teams"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="p-3 font-bold text-white text-center uppercase tracking-widest text-sm" style={{ backgroundColor: team.color.toLowerCase() }}>
                {team.name} Roster
              </div>
              
              <div className="p-4 space-y-3">
                {players.filter(p => p.team_id === team.id).map(player => (
                  <div key={player.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-medium text-slate-700">{player.name}</span>
                    {/* 🚨 FIXED DROPDOWN COLOR 🚨 */}
                    <select 
                      value={player.team_id || ""}
                      onChange={(e) => movePlayer(player.id, e.target.value)}
                      className="text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-1 cursor-pointer"
                    >
                      {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
                    </select>
                  </div>
                ))}
                {players.filter(p => p.team_id === team.id).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4 italic">No players assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Undrafted Players Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-800">Undrafted:</h3>
          {players.filter(p => !p.team_id).map(player => (
            <div key={player.id} className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-amber-800">
              <span className="font-medium">{player.name}</span>
              {/* 🚨 FIXED DROPDOWN COLOR 🚨 */}
              <select 
                onChange={(e) => movePlayer(player.id, e.target.value)}
                defaultValue=""
                className="text-xs border border-amber-300 rounded bg-white text-slate-900 focus:outline-none p-1"
              >
                <option value="" disabled>Draft...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
              </select>
            </div>
          ))}
          {players.filter(p => !p.team_id).length === 0 && (
            <span className="text-sm text-slate-400 italic">Everyone is drafted!</span>
          )}
        </div>
      </div>

    </div>
  );
}