import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Secret Code",
      credentials: {
        name: { label: "Your Name", type: "text", placeholder: "e.g. Webb" },
        code: { label: "Invite Code", type: "password", placeholder: "Enter code" },
      },
      async authorize(credentials) {
        if (credentials?.code === process.env.SECRET_INVITE_CODE && credentials?.name) {
          // If the code matches, let them in!
          return { id: credentials.name, name: credentials.name };
        }
        return null; // Reject if wrong code
      },
    }),
  ],
  callbacks: {
    // This runs every time someone logs in
    async signIn({ user, account }) {
      if (!user.name) return false;

      // Check if they already exist in our Supabase database
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", user.name)
        .single();

      // If they don't exist, add them!
      if (!existingProfile) {
        await supabase.from("profiles").insert([
          {
            name: user.name,
            discord_handle: account?.provider === "discord" ? user.name : null,
            role: "player", // Everyone defaults to a player
          },
        ]);
      }
      return true;
    },
  },
});

export { handler as GET, handler as POST };