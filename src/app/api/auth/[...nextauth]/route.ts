import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "../../../../lib/supabase";

export const authOptions: NextAuthOptions = {
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
          return { id: credentials.name, name: credentials.name };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.name) return false;
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", user.name)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert([
          {
            name: user.name,
            discord_handle: account?.provider === "discord" ? user.name : null,
            role: "player",
          },
        ]);
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };