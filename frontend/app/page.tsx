import { redirect } from "next/navigation"

export default function Home() {
  // Redireciona para login se não autenticado
  redirect("/login")
}
