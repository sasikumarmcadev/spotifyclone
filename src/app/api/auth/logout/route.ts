import { deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET() {
  await deleteSession();
  redirect("/");
}
