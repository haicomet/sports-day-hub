"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; score: number };
type Player = { id: string; name: string; team_id: string | null; role: string };
type Event = { id: string; name: string; time_string: string; winner_team_id: string | null; max_players_per_team: number };
type EventRoster = { id: string; event_id: string; team_id: string; player_id: string };

export default function AdminDashboard({ 
  teams, 
  initialPlayers, 
  initialEvents,
  initialEventRosters
}: { 
  teams: Team[], 
  initialPlayers: Player[], 
  initialEvents: Event[],
  initialEventRosters: EventRoster[]
}) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [teamsState, setTeamsState] = useState<Team[]>(teams);
  const [eventsState, setEventsState] = useState<Event[]>(initialEvents);
  const [eventRosters, setEventRosters] = useState<EventRoster[]>(initialEventRosters);
  
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
    if (pointsToAward > 0) updateScore(winningTeamId, pointsToAward);
    setEventPoints({ ...eventPoints, [eventId]: "" });
  };

  // --- MASTER EVENT ROSTER OVERRIDE ---
  const toggleMasterEventSignup = async (eventId: string, teamId: string, playerId: string) => {
    const existingSignup = eventRosters.find(er => er.event_id === eventId && er.player_id === playerId);
    
    if (existingSignup) {
      setEventRosters(eventRosters.filter(er => er.id !== existingSignup.id));
      await supabase.from("event_rosters").delete().eq("id", existingSignup.id);
    } else {
      const newRow = { id: crypto.randomUUID(), event_id: eventId, team_id: teamId, player_id: playerId };
      setEventRosters([...eventRosters, newRow]);
      await supabase.from("event_rosters").insert([{ event_id: eventId, team_id: teamId, player_id: playerId }]);
    }
  };

  // --- THE DRAFT RANDOMIZER ---
  const randomizeTeams = async () => {
    setIsDrafting(true);
    let shuffled = [...players];
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

  const undraftedPlayers = players.filter(p => !p.team_id);

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
                <input type="number" placeholder="Pts" value={customScores[team.id] || ""} onChange={(e) => setCustomScores({...customScores, [team.id]: e.target.value})} className="w-16 border border-slate-300 rounded-lg text-center text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => updateScore(team.id, parseInt(customScores[team.id] || "0", 10))} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-sm">Apply</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MASTER EVENT SIGN-UPS */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-emerald-600 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">🛠️ Master Event Roster</h2>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {eventsState.map(event => (
            <div key={event.id} className="border border-slate-200 rounded-xl bg-slate-50 p-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{event.name} <span className="text-sm font-normal text-slate-500">({event.max_players_per_team} max)</span></h3>
              
              <div className="space-y-4">
                {teamsState.map(team => {
                  const teamPlayers = players.filter(p => p.team_id === team.id);
                  const signedUpIds = eventRosters.filter(er => er.event_id === event.id && er.team_id === team.id).map(er => er.player_id);
                  const signedUpPlayers = teamPlayers.filter(p => signedUpIds.includes(p.id));
                  const availablePlayers = teamPlayers.filter(p => !signedUpIds.includes(p.id));
                  const isFull = signedUpPlayers.length >= event.max_players_per_team;

                  return (
                    <div key={team.id} className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm" style={{ color: team.color.toLowerCase() }}>{team.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{signedUpPlayers.length} / {event.max_players_per_team}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {/* BULLETPROOF TERNARY CHECK FOR EVENTS */}
                        {signedUpPlayers.length > 0 ? (
                          signedUpPlayers.map(p => (
                            <span key={p.id} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1 font-bold">
                              {p.name}
                              <button onClick={() => toggleMasterEventSignup(event.id, team.id, p.id)} className="text-slate-400 hover:text-red-600 ml-1">×</button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No one signed up for this event yet</span>
                        )}
                      </div>

                      {!isFull && availablePlayers.length > 0 && (
                        <select 
                          onChange={(e) => toggleMasterEventSignup(event.id, team.id, e.target.value)} 
                          value="" 
                          className="text-xs border border-slate-300 rounded p-1.5 w-full bg-white text-slate-900 cursor-pointer"
                        >
                          <option value="" disabled>+ Assign Player to Event...</option>
                          {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. EVENT RESULTS CONTROLLER */}
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
                  <div className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2">✅ Winner Locked: {teams.find(t => t.id === event.winner_team_id)?.name}</div>
                ) : (
                  <>
                    <input type="number" placeholder="Points" value={eventPoints[event.id] || ""} onChange={(e) => setEventPoints({...eventPoints, [event.id]: e.target.value})} className="w-24 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select onChange={(e) => lockEventResult(event.id, e.target.value)} defaultValue="" className="border border-slate-300 rounded-lg text-sm bg-white text-slate-900 font-medium cursor-pointer px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

      {/* 4. THE DRAFT ROOM */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">The Draft Room</h2>
          <button onClick={randomizeTeams} disabled={isDrafting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 transition-all">{isDrafting ? "Drafting..." : "🎲 Randomize Teams"}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => {
            const teamPlayers = players.filter(p => p.team_id === team.id);
            
            return (
              <div key={team.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 font-bold text-white text-center uppercase tracking-widest text-sm" style={{ backgroundColor: team.color.toLowerCase() }}>{team.name} Roster</div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  
                  {/* BULLETPROOF TERNARY CHECK FOR DRAFT */}
                  {teamPlayers.length > 0 ? (
                    teamPlayers.map(player => (
                      <div key={player.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-medium text-slate-700">{player.name}</span>
                        <select value={player.team_id || ""} onChange={(e) => movePlayer(player.id, e.target.value)} className="text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-1 cursor-pointer">
                          {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
                        </select>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <span className="text-sm text-slate-400 italic">No players drafted to this team yet.</span>
                    </div>
                  )}
                  
                </div>
              </div>
            );
          })}
        </div>

        {/* Undrafted Section Check */}
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-800">Undrafted Free Agents:</h3>
          {undraftedPlayers.length > 0 ? (
            undraftedPlayers.map(player => (
              <div key={player.id} className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-amber-800">
                <span className="font-medium">{player.name}</span>
                <select onChange={(e) => movePlayer(player.id, e.target.value)} defaultValue="" className="text-xs border border-amber-300 rounded bg-white text-slate-900 focus:outline-none p-1 cursor-pointer">
                  <option value="" disabled>Draft to...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
                </select>
              </div>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">Everyone has been drafted!</span>
          )}
        </div>

      </div>

    </div>
  );
}