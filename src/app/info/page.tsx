export default function InfoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      
      <div className="text-center mb-12 mt-8">
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mb-4">
          The Playbook
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Everything you need to know to survive and win Sports Day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* WHERE & WHEN */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            📍 Where & When
          </h2>
          <ul className="space-y-4 text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 w-24 flex-shrink-0">Location:</span>
              <span>Central Park (TBD)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 w-24 flex-shrink-0">Date:</span>
              <span>May 31st</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 w-24 flex-shrink-0">Arrival:</span>
              <span>TBD</span>
            </li>
          </ul>
        </div>

        {/* WHAT TO BRING */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            🎒 What to Bring
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">✅ <span className="font-medium">Athletic clothes</span> (matching your team color if possible!)</li>
            <li className="flex items-center gap-2">✅ <span className="font-medium">Proper footwear</span> </li>
            <li className="flex items-center gap-2">✅ <span className="font-medium">Sunscreen </span></li>
            <li className="flex items-center gap-2">✅ <span className="font-medium">Reusable water bottle</span></li>
            <li className="flex items-center gap-2">❌ <span className="line-through text-slate-400">Poor Sportsmanship</span></li>
          </ul>
        </div>
      </div>

      {/* THE RULES */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          ⚖️ The Rules of Engagement
        </h2>
        <div className="space-y-6 text-slate-600 dark:text-slate-300">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">1. The Roster Rule</h3>
            <p className="mt-1">You must sign up for an event via the Team HQ before participating. If your team does not fill the required slots for an event, you will automatically forfeit that game.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">3. Tie-Breakers</h3>
            <p className="mt-1">In the event of a tie at the end of the day, teams will nominate one champion for a sudden-death physical challenge.</p>
          </div>
        </div>
      </div>

    </div>
  );
}