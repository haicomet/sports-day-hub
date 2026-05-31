"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = { id: string; color: string; name: string; score: number; captain_id?: string | null };
type Player = { id: string; name: string; nickname?: string | null; team_id: string | null; role: string };
type Event = { id: string; name: string; time_string: string; winner_team_id: string | null; max_players_per_team: number; sort_order: number };
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
  const [isDrafting, setIsDrafting] = useState(false);

  // --- SCHEDULE MANAGER STATE ---
  const [newEvent, setNewEvent] = useState({ name: "", max_players_per_team: 5 });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventData, setEditEventData] = useState<Partial<Event>>({});
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);

  // --- NEW: MULTI-PLACEMENT RESULTS STATE ---
  type PlacementData = { base: number; p1: string; p2: string; p3: string; p4: string };
  const [resultsState, setResultsState] = useState<Record<string, PlacementData>>({});

  // 🚨 THE FIX: Added defaultBase so it doesn't forget the points when you click a dropdown!
  const handleResultChange = (eventId: string, field: keyof PlacementData, value: any, defaultBase: number) => {
    setResultsState(prev => {
      const current = prev[eventId] || { base: defaultBase, p1: "", p2: "", p3: "", p4: "" };
      return {
        ...prev,
        [eventId]: { ...current, [field]: value }
      };
    });
  };

  // --- ACCOUNT CLEANUP ---
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${playerName}"? This will remove them from all rosters.`)) return;
    setIsProcessingEvent(true);
    await supabase.from("event_rosters").delete().eq("player_id", playerId);
    setEventRosters(eventRosters.filter(er => er.player_id !== playerId));
    const teamTheyCaptain = teamsState.find(t => t.captain_id === playerId);
    if (teamTheyCaptain) {
      await supabase.from("teams").update({ captain_id: null }).eq("id", teamTheyCaptain.id);
      setTeamsState(teamsState.map(t => t.id === teamTheyCaptain.id ? { ...t, captain_id: null } : t));
    }
    await supabase.from("profiles").delete().eq("id", playerId);
    setPlayers(players.filter(p => p.id !== playerId));
    setIsProcessingEvent(false);
  };

  // --- EVENT CREATION & UPDATES ---
  const handleCreateEvent = async () => {
    if (!newEvent.name) return;
    setIsProcessingEvent(true);
    const nextSortOrder = eventsState.length > 0 ? Math.max(...eventsState.map(e => e.sort_order || 0)) + 1 : 1;
    const eventId = crypto.randomUUID();
    const newEventObj: Event = { id: eventId, name: newEvent.name, time_string: "", max_players_per_team: newEvent.max_players_per_team, sort_order: nextSortOrder, winner_team_id: null };
    setEventsState([...eventsState, newEventObj]);
    await supabase.from("events").insert([newEventObj]);
    setNewEvent({ name: "", max_players_per_team: 5 });
    setIsProcessingEvent(false);
  };

  const handleUpdateEvent = async (id: string) => {
    setIsProcessingEvent(true);
    setEventsState(eventsState.map(e => e.id === id ? { ...e, ...editEventData } : e));
    await supabase.from("events").update(editEventData).eq("id", id);
    setEditingEventId(null);
    setEditEventData({});
    setIsProcessingEvent(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? This will remove all sign-ups for it.")) return;
    setIsProcessingEvent(true);
    setEventsState(eventsState.filter(e => e.id !== id));
    setEventRosters(eventRosters.filter(er => er.event_id !== id));
    await supabase.from("event_rosters").delete().eq("event_id", id);
    await supabase.from("events").delete().eq("id", id);
    setIsProcessingEvent(false);
  };

  const moveEvent = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === eventsState.length - 1) return;
    setIsProcessingEvent(true);
    const newEvents = [...eventsState];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newEvents[index], newEvents[swapIndex]] = [newEvents[swapIndex], newEvents[index]];
    const updatedEvents = newEvents.map((e, i) => ({ ...e, sort_order: i + 1 }));
    setEventsState(updatedEvents);
    for (const ev of updatedEvents) {
      await supabase.from("events").update({ sort_order: ev.sort_order }).eq("id", ev.id);
    }
    setIsProcessingEvent(false);
  };

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

  // --- MANUAL SCORE OVERRIDE ---
  const updateScore = async (teamId: string, delta: number) => {
    const team = teamsState.find(t => t.id === teamId);
    if (!team) return;
    const newScore = (team.score || 0) + delta;
    setTeamsState(teamsState.map(t => t.id === teamId ? { ...t, score: newScore } : t));
    await supabase.from("teams").update({ score: newScore }).eq("id", teamId);
    setCustomScores({ ...customScores, [teamId]: "" });
  };

  // --- AUTO-MATH EVENT LOCKER ---
  const lockMultiPlacementResult = async (eventId: string, basePts: number) => {
    const data = resultsState[eventId];
    if (!data || !data.p1) {
      alert("You must select at least a 1st Place winner!");
      return;
    }
    setIsProcessingEvent(true);

    // 🚨 THE FIX: Make sure the math ignores blank dropdowns completely
    const pointsToAward: Record<string, number> = {};
    if (data.p1) pointsToAward[data.p1] = basePts;
    if (data.p2) pointsToAward[data.p2] = Math.round(basePts * 0.6);
    if (data.p3) pointsToAward[data.p3] = Math.round(basePts * 0.3);
    if (data.p4) pointsToAward[data.p4] = Math.round(basePts * 0.1);

    const updatedTeams = teamsState.map(t => {
      const addedPts = pointsToAward[t.id];
      return addedPts ? { ...t, score: (t.score || 0) + addedPts } : t;
    });
    setTeamsState(updatedTeams);

    for (const [tId, pts] of Object.entries(pointsToAward)) {
      if (tId && pts > 0) {
        const team = teamsState.find(t => t.id === tId);
        if (team) {
          await supabase.from("teams").update({ score: (team.score || 0) + pts }).eq("id", tId);
        }
      }
    }

    setEventsState(eventsState.map(e => e.id === eventId ? { ...e, winner_team_id: data.p1 } : e));
    await supabase.from("events").update({ winner_team_id: data.p1 }).eq("id", eventId);
    setIsProcessingEvent(false);
  };

  // --- DRAFTING ---
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

  const undraftedPlayers = players.filter(p => !p.team_id);
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

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

      {/* 2. EVENT SCHEDULE MANAGER */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">🗓️ Schedule & Queue Manager</h2>
        </div>
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Name</label>
            <input type="text" placeholder="e.g. Tug of War (50 Pts)" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Athletes/Team</label>
            <input type="number" min="1" value={newEvent.max_players_per_team} onChange={e => setNewEvent({...newEvent, max_players_per_team: parseInt(e.target.value) || 1})} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleCreateEvent} disabled={isProcessingEvent} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">+ Add Event</button>
        </div>

        <div className="p-6 space-y-3">
          {eventsState.map((event, index) => (
            <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl gap-4 shadow-sm">
              <div className="flex flex-row md:flex-col gap-2">
                <button onClick={() => moveEvent(index, 'up')} disabled={index === 0 || isProcessingEvent} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 p-2 rounded transition-colors flex items-center justify-center" title="Move Up">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => moveEvent(index, 'down')} disabled={index === eventsState.length - 1 || isProcessingEvent} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 p-2 rounded transition-colors flex items-center justify-center" title="Move Down">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              <div className="flex-1 flex flex-col md:flex-row gap-4">
                {editingEventId === event.id ? (
                  <>
                    <input type="text" value={editEventData.name || ""} onChange={e => setEditEventData({...editEventData, name: e.target.value})} className="flex-1 border border-slate-300 rounded-lg p-1.5 bg-white text-slate-900 font-bold" />
                    <input type="number" value={editEventData.max_players_per_team || ""} onChange={e => setEditEventData({...editEventData, max_players_per_team: parseInt(e.target.value)})} className="w-20 border border-slate-300 rounded-lg p-1.5 bg-white text-slate-900 text-sm text-center" />
                  </>
                ) : (
                  <>
                    <div className="flex-1 font-bold text-slate-900 flex items-center text-lg">{event.name}</div>
                    <div className="w-32 text-slate-500 font-medium text-sm flex items-center">👥 {event.max_players_per_team} Athletes</div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                {editingEventId === event.id ? (
                  <button onClick={() => handleUpdateEvent(event.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm">Save</button>
                ) : (
                  <button onClick={() => { setEditingEventId(event.id); setEditEventData(event); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-4 rounded-lg text-sm">Edit</button>
                )}
                <button onClick={() => handleDeleteEvent(event.id)} disabled={isProcessingEvent} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold p-2 rounded-lg text-sm transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MASTER EVENT SIGN-UPS */}
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
                        {signedUpPlayers.length > 0 ? (
                          signedUpPlayers.map(p => (
                            <span key={p.id} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1 font-bold">
                              {p.nickname ? `${p.name} (${p.nickname})` : p.name}
                              <button onClick={() => toggleMasterEventSignup(event.id, team.id, p.id)} className="text-slate-400 hover:text-red-600 ml-1">×</button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No athletes assigned yet</span>
                        )}
                      </div>
                      {!isFull && availablePlayers.length > 0 && (
                        <select onChange={(e) => toggleMasterEventSignup(event.id, team.id, e.target.value)} value="" className="text-xs border border-slate-300 rounded p-1.5 w-full bg-white text-slate-900 cursor-pointer">
                          <option value="" disabled>+ Assign Player to Event...</option>
                          {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.nickname ? `${p.name} (${p.nickname})` : p.name}</option>)}
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

      {/* 4. THE AUTO-MATH RESULTS CONTROLLER */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-amber-500 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">🏆 Log Event Results (Auto-Scoring)</h2>
        </div>
        <div className="p-6 space-y-4">
          {eventsState.map(event => {
            const match = event.name.match(/\((\d+)\s*Pts\)/i);
            const defaultBasePoints = match ? parseInt(match[1]) : 0;
            const data = resultsState[event.id] || { base: defaultBasePoints, p1: "", p2: "", p3: "", p4: "" };
            const basePts = data.base !== undefined ? data.base : defaultBasePoints;

            return (
              <div key={event.id} className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <h4 className="text-xl font-black text-slate-900">{event.name}</h4>
                  {event.winner_team_id && (
                    <span className="bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-lg font-bold text-sm shadow-sm">
                      ✅ Results Locked
                    </span>
                  )}
                </div>

                {!event.winner_team_id && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Pts</label>
                      <input 
                        type="number" 
                        value={basePts} 
                        onChange={(e) => handleResultChange(event.id, 'base', parseInt(e.target.value) || 0, defaultBasePoints)}
                        className="w-full border border-slate-300 rounded-lg text-sm bg-white text-slate-900 p-2 font-black focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg">
                      <label className="block text-[10px] font-black text-amber-600 uppercase mb-1">🥇 1st (100%) - {basePts}pts</label>
                      <select value={data.p1} onChange={(e) => handleResultChange(event.id, 'p1', e.target.value, defaultBasePoints)} className="w-full text-xs border border-amber-300 rounded bg-white text-slate-900 p-1.5 cursor-pointer focus:ring-1 focus:ring-amber-500">
                        <option value="" disabled>Winner...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="bg-slate-100 border border-slate-300 p-2 rounded-lg">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">🥈 2nd (60%) - {Math.round(basePts * 0.6)}pts</label>
                      <select value={data.p2} onChange={(e) => handleResultChange(event.id, 'p2', e.target.value, defaultBasePoints)} className="w-full text-xs border border-slate-300 rounded bg-white text-slate-900 p-1.5 cursor-pointer focus:ring-1 focus:ring-slate-500">
                        <option value="">None</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg">
                      <label className="block text-[10px] font-black text-orange-600 uppercase mb-1">🥉 3rd (30%) - {Math.round(basePts * 0.3)}pts</label>
                      <select value={data.p3} onChange={(e) => handleResultChange(event.id, 'p3', e.target.value, defaultBasePoints)} className="w-full text-xs border border-orange-300 rounded bg-white text-slate-900 p-1.5 cursor-pointer focus:ring-1 focus:ring-orange-500">
                        <option value="">None</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center h-full">
                      <button 
                        onClick={() => lockMultiPlacementResult(event.id, basePts)}
                        disabled={isProcessingEvent}
                        className="w-full h-full bg-amber-500 hover:bg-amber-400 text-white font-black uppercase tracking-wider py-2 px-4 rounded-lg shadow-md transition-all text-sm"
                      >
                        Lock & Score
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. THE DRAFT ROOM */}
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
                  {teamPlayers.length > 0 ? (
                    teamPlayers.map(player => (
                      <div key={player.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-medium text-slate-700 truncate">{player.nickname ? `${player.name} (${player.nickname})` : player.name}</span>
                        <select value={player.team_id || ""} onChange={(e) => movePlayer(player.id, e.target.value)} className="text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-1 ml-2 cursor-pointer">
                          {teams.map(t => <option key={t.id} value={t.id}>{t.color}</option>)}
                        </select>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-6"><span className="text-sm text-slate-400 italic">No players drafted.</span></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-6 flex items-center gap-4 flex-wrap">
          <h3 className="font-bold text-slate-800">Undrafted Free Agents:</h3>
          {undraftedPlayers.length > 0 ? (
            undraftedPlayers.map(player => (
              <div key={player.id} className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-amber-800">
                <span className="font-medium">{player.nickname ? `${player.name} (${player.nickname})` : player.name}</span>
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

      {/* 6. PLAYER DIRECTORY & CLEANUP */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-4">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">📇 Player Directory & Cleanup</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">View all registered accounts. Use the trash can to delete duplicates or players who can no longer attend.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-sm font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3">Player Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Team</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPlayers.map(player => {
                  const assignedTeam = teams.find(t => t.id === player.team_id);
                  const isCaptain = assignedTeam?.captain_id === player.id;
                  
                  return (
                    <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-900">
                        {player.nickname ? `${player.name} (${player.nickname})` : player.name} 
                        {isCaptain && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Captain</span>}
                      </td>
                      <td className="p-3 text-sm text-slate-500 capitalize">{player.role}</td>
                      <td className="p-3 text-sm">
                        {assignedTeam ? (
                          <span className="font-bold" style={{ color: assignedTeam.color.toLowerCase() }}>{assignedTeam.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Undrafted</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {player.role !== "admin" ? (
                          <button 
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            disabled={isProcessingEvent}
                            className="text-slate-400 hover:text-red-600 p-2 rounded transition-colors inline-flex"
                            title="Delete Player"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 italic px-2">Admin</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}