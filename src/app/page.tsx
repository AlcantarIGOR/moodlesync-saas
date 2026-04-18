import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"

export default async function Page() {
  const session = await auth()
  if (session?.user?.id) redirect("/dashboard/tareas")
  return <LandingPage />
}
