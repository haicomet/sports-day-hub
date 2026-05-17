"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react"; // 🚨 IMPORT NEXT-AUTH SIGNOUT

export default function NavUI({ session, isAdmin }: { session: any, isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  const NavLinks = () => (
    <>
      <Link href="/" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Dashboard</Link>
      <Link href="/events" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Schedule</Link>
      
      {session && (
        <>
          <Link href="/rsvp" onClick={closeMenu} className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">RSVP</Link>
          <Link href="/roster" onClick={closeMenu} className="text-sky-400 hover:bg-slate-800 hover:text-sky-300 px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Directory</Link>
          <Link href="/team" onClick={closeMenu} className="text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">My Team</Link>
        </>
      )}
      
      {isAdmin && (
        <Link href="/admin" onClick={closeMenu} className="text-purple-400 hover:bg-slate-800 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-bold transition-all block md:inline-block">Admin Hub</Link>
      )}
      
      <Link href="/info" onClick={closeMenu} className="text-amber-400 hover:bg-slate-800 hover:text-amber-300 px-3 py-2 rounded-md text-sm font-medium transition-all block md:inline-block">Info</Link>
    </>
  );

  return (
    <nav className="bg-slate-900 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 font-black text-xl uppercase tracking-widest text-white">
            <Link href="/" onClick={closeMenu}>Sports Day</Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-between ml-10">
            <div className="flex items-baseline space-x-2">
              <NavLinks />
            </div>
            
            {/* DESKTOP SIGN OUT BUTTON */}
            {session ? (
              <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className="text-slate-400 hover:text-red-400 text-sm font-bold px-3 py-2 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/api/auth/signin" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" onClick={closeMenu}></div>}

      <div className={`fixed inset-y-0 right-0 w-64 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div>
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <span className="font-black text-lg uppercase tracking-widest text-white">Menu</span>
            <button onClick={closeMenu} className="text-slate-400 hover:text-white p-1">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="px-4 pt-4 pb-6 flex flex-col space-y-2 overflow-y-auto">
            <NavLinks />
          </div>
        </div>
        
        {/* MOBILE SIGN OUT BUTTON */}
        <div className="p-6 border-t border-slate-800">
          {session ? (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-center bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-bold py-3 rounded-xl transition-colors">
              Sign Out
            </button>
          ) : (
            <Link href="/api/auth/signin" onClick={closeMenu} className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}