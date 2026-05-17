import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export default async function Navigation() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center space-x-8">
            <Link href="/" className="font-extrabold text-2xl tracking-tight text-indigo-400 hover:text-indigo-300 transition-colors">
              🏆 Sports Day 2026
            </Link>
            
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-2">
                <Link href="/" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-all">Dashboard</Link>
                <Link href="/rsvp" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-all">RSVP</Link>
                <Link href="/events" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-all">Schedule</Link>
                
                {session && (
                  <Link href="/admin" className="text-amber-400 hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium transition-all">Admin Hub</Link>
                )}
              </div>
            </div>
          </div>

          <div>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400 font-medium hidden sm:block">
                  Athlete: <span className="text-white">{session.user?.name}</span>
                </span>
                <Link href="/api/auth/signout" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-all">
                  Logout
                </Link>
              </div>
            ) : (
              <Link href="/api/auth/signin" className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-600/30">
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}