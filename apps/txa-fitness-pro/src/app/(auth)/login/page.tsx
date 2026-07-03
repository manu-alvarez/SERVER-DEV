import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Inicia sesión en tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          O{" "}
          <Link href="/register" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
            crea una cuenta nueva gratis
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-brand-900/20 sm:rounded-2xl sm:px-10 border border-white/10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
