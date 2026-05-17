"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string };
type Player = { id: string; name: string; team_id: string | null; role: string };

export default function AdminDashboard({ teams, initialPlayers }: { teams: Team[], initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isDrafting, setIsDrafting] = useState(false);

  // --- THE RANDOMIZER ALGORITHM ---
  const randomizeTeams = async () => {
    setIsDrafting(true);
    
    // 1. Get all players and shuffle them (Fisher-Yates algorithm)
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Distribute evenly among the 4 teams
    const updatedPlayers = shuffled.map((player, index) => {
      const assignedTeam = teams[index % teams.length];
      return { ...player, team_id: assignedTeam.id };
    });

    // 3. Update the UI instantly
    setPlayers(updatedPlayers);

    // 4. Save to Supabase in the background
    for (const player of updatedPlayers) {
      await supabase.from("profiles").update({ team_id: player.team_id }).eq("id", player.id);
    }
    
    setIsDrafting(false);
  };

  // --- THE MANUAL OVERRIDE (TRADE PLAYER) ---
  const movePlayer = async (playerId: string, newTeamId: string) => {
    // 1. Update UI instantly
    setPlayers(players.map(p => p.id === playerId ? { ...p, team_id: newTeamId } : p));
    
    // 2. Update Supabase
    await supabase.from("profiles").update({ team_id: newTeamId }).eq("id", playerId);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 uppercase">Admin Hub: The Draft</h1>
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
            <div className={`p-4 font-bold text-white text-center uppercase tracking-widest`} 
                 style={{ backgroundColor: team.color.toLowerCase() }}>
              {team.name}
            </div>
            
            <div className="p-4 space-y-3">
              {players.filter(p => p.team_id === team.id).map(player => (
                <div key={player.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="font-medium text-slate-700">{player.name}</span>
                  
                  {/* MANUAL OVERRIDE DROPDOWN */}
                  <select 
                    value={player.team_id || ""}
                    onChange={(e) => movePlayer(player.id, e.target.value)}
                    className="text-xs border-slate-300 rounded bg-white text-slate-600 focus:ring-indigo-500 p-1 cursor-pointer"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.color}</option>
                    ))}
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
      <div className="mt-12 bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Undrafted Players</h2>
        <div className="flex flex-wrap gap-3">
          {players.filter(p => !p.team_id).map(player => (
            <div key={player.id} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
              <span className="font-medium text-slate-700">{player.name}</span>
              <select 
                onChange={(e) => movePlayer(player.id, e.target.value)}
                defaultValue=""
                className="text-xs border-slate-300 rounded bg-white text-slate-600 p-1"
              >
                <option value="" disabled>Assign...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
              </select>
            </div>
          ))}
          {players.filter(p => !p.team_id).length === 0 && (
            <p className="text-sm text-slate-400 italic">Everyone has been drafted!</p>
          )}
        </div>
      </div>
    </div>
  );
}