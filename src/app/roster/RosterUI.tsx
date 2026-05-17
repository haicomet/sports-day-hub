"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; captain_id?: string | null };
type Player = { id: string; name: string; nickname?: string | null; team_id: string | null; role: string };

export default function RosterUI({ 
  initialPlayers, 
  teams, 
  currentUser 
}: { 
  initialPlayers: Player[], 
  teams: Team[], 
  currentUser: Player 
}) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNickname, setTempNickname] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = currentUser.role === "admin";

  // --- NICKNAME LOGIC ---
  const handleSaveNickname = async (playerId: string) => {
    setIsProcessing(true);
    setPlayers(players.map(p => p.id === playerId ? { ...p, nickname: tempNickname } : p));
    await supabase.from("profiles").update({ nickname: tempNickname }).eq("id", playerId);
    setEditingId(null);
    setIsProcessing(false);
  };

  // --- SAFE DELETE LOGIC (Admins Only) ---
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${playerName}"?`)) return;
    setIsProcessing(true);

    await supabase.from("event_rosters").delete().eq("player_id", playerId);
    
    const teamTheyCaptain = teams.find(t => t.captain_id === playerId);
    if (teamTheyCaptain) {
      await supabase.from("teams").update({ captain_id: null }).eq("id", teamTheyCaptain.id);
    }

    await supabase.from("profiles").delete().eq("id", playerId);
    setPlayers(players.filter(p => p.id !== playerId));
    setIsProcessing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          League Directory
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          The official roster of all registered athletes.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Athlete</th>
                <th className="p-4">Nickname</th>
                <th className="p-4">Team</th>
                {isAdmin && <th className="p-4 text-right">Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {players.map(player => {
                const assignedTeam = teams.find(t => t.id === player.team_id);
                const isCaptain = assignedTeam?.captain_id === player.id;
                const canEditNickname = isAdmin || currentUser.id === player.id;

                return (
                  <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* ATHLETE NAME & ROLE */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {player.name}
                        {isCaptain && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">Captain</span>}
                        {player.role === "admin" && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">Ref</span>}
                      </div>
                    </td>

                    {/* NICKNAME EDITOR */}
                    <td className="p-4">
                      {editingId === player.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={tempNickname} 
                            onChange={(e) => setTempNickname(e.target.value)}
                            placeholder="A.K.A..."
                            className="border border-slate-300 dark:border-slate-600 rounded-lg p-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 w-32"
                            maxLength={20}
                            autoFocus
                          />
                          <button onClick={() => handleSaveNickname(player.id)} disabled={isProcessing} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 group">
                          <span className="text-slate-600 dark:text-slate-300 italic font-medium">
                            {player.nickname ? `"${player.nickname}"` : <span className="text-slate-300 dark:text-slate-600">None</span>}
                          </span>
                          {canEditNickname && (
                            <button 
                              onClick={() => { setTempNickname(player.nickname || ""); setEditingId(player.id); }}
                              className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Nickname"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* TEAM FLAG */}
                    <td className="p-4">
                      {assignedTeam ? (
                        <span className="font-bold text-sm px-3 py-1 rounded-full border bg-opacity-10 dark:bg-opacity-20" style={{ color: assignedTeam.color.toLowerCase(), borderColor: assignedTeam.color.toLowerCase(), backgroundColor: assignedTeam.color.toLowerCase() }}>
                          {assignedTeam.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Free Agent</span>
                      )}
                    </td>

                    {/* ADMIN CONTROLS */}
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {player.id !== currentUser.id ? (
                          <button 
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            disabled={isProcessing}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Delete Player"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 italic">You</span>
                        )}
                      </td>
                    )}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}