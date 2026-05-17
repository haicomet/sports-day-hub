"use client";

import Link from "next/link";
import { useState } from "react";

// It accepts the session data from the server wrapper
export default function NavUI({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to instantly close the menu when a link is clicked
  const closeMenu = () => setIsOpen(false);

  // We abstract the links here so we don't have to type them twice!
  const NavLinks = () => (
    <>
      <Link href="/" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Dashboard</Link>
      <Link href="/rsvp" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">RSVP</Link>
      
      {session && (
        <Link href="/team" onClick={closeMenu} className="text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">My Team</Link>
      )}
      
      <Link href="/events" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Schedule</Link>
      <Link href="/info" onClick={closeMenu} className="text-amber-400 hover:bg-slate-800 hover:text-amber-300 px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Rules & Info</Link>
    </>
  );

  return (
    <nav className="bg-slate-900 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* --- LOGO --- */}
          <div className="flex-shrink-0 font-black text-xl uppercase tracking-widest text-white">
            <Link href="/" onClick={closeMenu}>Sports Day</Link>
          </div>

          {/* --- DESKTOP NAV (Hidden on mobile) --- */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLinks />
            </div>
          </div>

          {/* --- MOBILE HAMBURGER BUTTON (Hidden on desktop) --- */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {/* Switches between the 3 lines and the X icon based on state */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE OVERLAY (Darkens the background when menu is open) --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" onClick={closeMenu}></div>
      )}

      {/* --- MOBILE SLIDE-OUT SIDEBAR --- */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <span className="font-black text-lg uppercase tracking-widest text-white">Menu</span>
          <button onClick={closeMenu} className="text-slate-400 hover:text-white focus:outline-none p-1">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-4 pt-4 pb-6 flex flex-col space-y-2 overflow-y-auto">
          <NavLinks />
        </div>
      </div>

    </nav>
  );
}