import { HomePage } from "@/components/home-page";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  return <HomePage session={session} />;
}
