import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import NavUI from "./NavUI";

export default async function Navigation() {
  // Fetch the secure session on the server
  const session = await getServerSession(authOptions);

  // Pass it to the interactive client component
  return <NavUI session={session} />;
}