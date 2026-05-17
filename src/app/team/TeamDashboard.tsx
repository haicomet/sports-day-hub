"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; score: number };
type Player = { id: string; name: string; role: string };

export default function TeamDashboard({ initialTeam, roster, currentUser }: { initialTeam: Team, roster: Player[], currentUser: string }) {
  const [team, setTeam] = useState<Team>(initialTeam);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(team.name);
  const [isSaving, setIsSaving] = useState(false);

  const saveTeamName = async () => {
    if (!newName.trim() || newName === team.name) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    
    // 1. Instantly update UI
    setTeam({ ...team, name: newName });
    
    // 2. Quietly update the database
    await supabase.from("teams").update({ name: newName }).eq("id", team.id);
    
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* --- TEAM HEADER CARD --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Dynamic Color Banner */}
        <div className="h-4 w-full" style={{ backgroundColor: team.color.toLowerCase() }} />
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex-1">
            <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: team.color.toLowerCase() }}>
              Team HQ
            </p>
            
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-3xl md:text-5xl font-black bg-white text-slate-900 border-2 border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 w-full max-w-sm"
                  autoFocus
                  maxLength={25}
                />
                <div className="flex gap-2">
                  <button onClick={saveTeamName} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all">
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setIsEditing(false); setNewName(team.name); }} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center md:items-baseline gap-4">
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {team.name}
                </h1>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2 px-4 rounded-full transition-colors"
                >
                  ✏️ Edit Name
                </button>
              </div>
            )}
          </div>

          {/* Current Score Display */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center min-w-[150px]">
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-6xl font-black text-slate-900 dark:text-white">{team.score || 0}</p>
          </div>

        </div>
      </div>

      {/* --- THE ROSTER --- */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          👥 Official Roster
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {roster.map((player) => (
            <div 
              key={player.id} 
              className={`p-4 rounded-xl border flex items-center justify-between ${
                player.name === currentUser 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className={`font-bold text-lg ${player.name === currentUser ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>
                {player.name}
              </span>
              {player.name === currentUser && (
                <span className="text-xs font-black bg-indigo-600 text-white px-2 py-1 rounded-md uppercase tracking-wider">You</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}