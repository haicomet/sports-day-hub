"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; score: number; captain_id: string | null };
// Added nickname to the Player type
type Player = { id: string; name: string; nickname?: string | null; role: string };
type Event = { id: string; name: string; time_string: string; max_players_per_team: number };
type EventRoster = { id: string; event_id: string; team_id: string; player_id: string };

export default function TeamDashboard({ 
  initialTeam, 
  roster, 
  events,
  initialEventRosters,
  currentUserProfile 
}: { 
  initialTeam: Team, 
  roster: Player[], 
  events: Event[],
  initialEventRosters: EventRoster[],
  currentUserProfile: Player 
}) {
  const [team, setTeam] = useState<Team>(initialTeam);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(team?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [eventRosters, setEventRosters] = useState<EventRoster[]>(initialEventRosters);

  const isCaptain = team.captain_id === currentUserProfile.id;
  const isAdmin = currentUserProfile.role === "admin";
  const canManageRoster = isCaptain || isAdmin;

  const claimCaptain = async () => {
    setTeam({ ...team, captain_id: currentUserProfile.id });
    await supabase.from("teams").update({ captain_id: currentUserProfile.id }).eq("id", team.id);
  };

  const saveTeamName = async () => {
    if (!newName.trim() || newName === team.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setTeam({ ...team, name: newName });
    await supabase.from("teams").update({ name: newName }).eq("id", team.id);
    setIsSaving(false);
    setIsEditing(false);
  };

  const toggleEventSignup = async (eventId: string, playerId: string) => {
    const existingSignup = eventRosters.find(er => er.event_id === eventId && er.player_id === playerId);
    
    if (existingSignup) {
      setEventRosters(eventRosters.filter(er => er.id !== existingSignup.id));
      await supabase.from("event_rosters").delete().eq("id", existingSignup.id);
    } else {
      const newRow = { id: crypto.randomUUID(), event_id: eventId, team_id: team.id, player_id: playerId };
      setEventRosters([...eventRosters, newRow]);
      await supabase.from("event_rosters").insert([{ event_id: eventId, team_id: team.id, player_id: playerId }]);
    }
  };

  const captainObj = roster.find(p => p.id === team.captain_id);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      
      {/* TEAM HEADER CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="h-4 w-full" style={{ backgroundColor: team.color.toLowerCase() }} />
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <p className="text-sm font-bold tracking-widest uppercase" style={{ color: team.color.toLowerCase() }}>Team HQ</p>
              {captainObj ? (
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  👑 Captain: {captainObj.nickname ? `${captainObj.name} (${captainObj.nickname})` : captainObj.name}
                </span>
              ) : (
                <button onClick={claimCaptain} className="text-xs bg-amber-500 hover:bg-amber-400 text-white shadow-sm px-3 py-0.5 rounded-full font-bold transition-all animate-pulse">
                  Claim Captain Role
                </button>
              )}
            </div>
            
            {isEditing && canManageRoster ? (
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
                  <button onClick={saveTeamName} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all">Save</button>
                  <button onClick={() => { setIsEditing(false); setNewName(team.name); }} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center md:items-baseline gap-4 mt-2">
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{team.name}</h1>
                {canManageRoster && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2 px-4 rounded-full transition-colors">✏️ Edit Name</button>
                )}
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center min-w-[150px]">
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-6xl font-black text-slate-900 dark:text-white">{team.score || 0}</p>
          </div>
        </div>
      </div>

      {/* EVENT SIGN-UPS */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">📋 Event Sign-Ups</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {canManageRoster 
                ? "👑 You are managing the roster. Assign players to their events below." 
                : "Coordinate with your team. Only click 'Join' if you are competing!"}
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          {events.map(event => {
            const signedUpIds = eventRosters.filter(er => er.event_id === event.id).map(er => er.player_id);
            const signedUpPlayers = roster.filter(p => signedUpIds.includes(p.id));
            const availablePlayers = roster.filter(p => !signedUpIds.includes(p.id));
            const amISignedUp = signedUpIds.includes(currentUserProfile.id);
            const isFull = signedUpPlayers.length >= event.max_players_per_team;

            return (
              <div key={event.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between">
                
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">{event.time_string}</p>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{event.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
                    <span>👥 {signedUpPlayers.length} / {event.max_players_per_team} Athletes</span>
                    {isFull && !amISignedUp && !canManageRoster && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs uppercase tracking-wider">Team Roster Full</span>}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {signedUpPlayers.map((player) => (
                      <span key={player.id} className={`flex items-center gap-1 text-xs font-bold pl-3 pr-2 py-1 rounded-full ${player.id === currentUserProfile.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
                        {player.nickname ? `${player.name} (${player.nickname})` : player.name}
                        {(canManageRoster || player.id === currentUserProfile.id) && (
                          <button onClick={() => toggleEventSignup(event.id, player.id)} className="ml-1 text-slate-400 hover:text-red-500 bg-white/50 dark:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors">×</button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center border-t border-slate-100 dark:border-slate-700 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
                  {canManageRoster ? (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {!isFull && availablePlayers.length > 0 ? (
                        <select onChange={(e) => toggleEventSignup(event.id, e.target.value)} value="" className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg block w-full p-2.5 font-medium cursor-pointer">
                          <option value="" disabled>+ Add Player...</option>
                          {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.nickname ? `${p.name} (${p.nickname})` : p.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-center">
                          {isFull ? "Roster Full" : "Everyone Added"}
                        </span>
                      )}
                    </div>
                  ) : (
                    amISignedUp ? (
                      <button onClick={() => toggleEventSignup(event.id, currentUserProfile.id)} className="w-full md:w-auto bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-all">Withdraw</button>
                    ) : (
                      <button onClick={() => toggleEventSignup(event.id, currentUserProfile.id)} disabled={isFull} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md disabled:shadow-none">
                        {isFull ? "Roster Full" : "Join Event"}
                      </button>
                    )
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}