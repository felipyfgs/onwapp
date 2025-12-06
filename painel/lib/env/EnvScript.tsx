import { unstable_noStore as noStore } from "next/cache"
import { runtimeEnvConfig } from "./config"

export const ENV_SCRIPT_ID = "env-config"

export default function EnvScript() {
  // Force dynamic rendering - env vars are read at runtime, not build time
  noStore()

  return (
    <script
      id={ENV_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(runtimeEnvConfig),
      }}
    />
  )
}
