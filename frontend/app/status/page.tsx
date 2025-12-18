import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

async function checkBackendStatus() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch("http://localhost:8080/health", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (res.ok) {
      const data = await res.json()
      return { status: "online", data }
    }
    return { status: "error", data: null }
  } catch (error) {
    return { status: "offline", data: null }
  }
}

export default async function StatusPage() {
  const backend = await checkBackendStatus()

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Backend Go</span>
              <div className="flex items-center gap-2">
                {backend.status === "online" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={
                  backend.status === "online" ? "text-green-600" : "text-red-600"
                }>
                  {backend.status === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>URL Backend:</strong> http://localhost:8080</p>
              <p><strong>Health Check:</strong> /health</p>
            </div>

            {backend.status === "online" && (
              <div className="text-xs text-muted-foreground p-2 bg-green-50 border border-green-200 rounded">
                Backend respondendo corretamente. Você pode usar as credenciais de teste:
                <br/><strong>Email:</strong> demo@onwapp.com
                <br/><strong>Senha:</strong> demo1234
              </div>
            )}

            {backend.status === "offline" && (
              <div className="text-xs text-muted-foreground p-2 bg-red-50 border border-red-200 rounded">
                Backend não está respondendo. Para testar o frontend completo:
                <br/>1. <code>cd backend && go run cmd/server/main.go</code>
                <br/>2. Certifique-se que PostgreSQL e NATS estão rodando
              </div>
            )}

            <div className="pt-4 border-t">
              <a 
                href="/login" 
                className="block w-full text-center py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Ir para Login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
