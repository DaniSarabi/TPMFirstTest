import { LoginForm } from "@/components/login-form"
import Login from "./auth/login"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Login />
        <h1>Login.tsx</h1>
      </div>
    </div>
  )
}
