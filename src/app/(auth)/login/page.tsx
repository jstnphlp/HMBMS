import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  Droplets,
  ShieldCheck,
  BarChart3,
  Shield,
  Heart,
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col md:flex-row">
        {/* ── Hero Section (Left) ── */}
        <section className="relative hidden overflow-hidden md:flex md:w-7/12 clinical-gradient flex-col justify-center px-16 text-primary-foreground">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-accent blur-2xl" />
          </div>

          <div className="relative z-10 max-w-xl">
            {/* Logo + brand */}
            <div className="mb-8 flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-white shadow-lg">
                <Image
                  src="/mmblogo.png"
                  alt="Makati Milk Bank logo"
                  fill
                  sizes="64px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl leading-8 font-semibold tracking-tight">
                  Makati Human Milk Bank
                </h1>
                <p className="text-xs font-bold tracking-widest text-primary-foreground/70 uppercase">
                  Health Management System
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="mb-6 text-5xl leading-tight font-extrabold">
              Clinical Staff Portal
              <br />
              
            </h2>

            <p className="mb-12 text-lg leading-relaxed opacity-80">
              Ensuring the highest standards of safety and efficiency in human
              milk banking. Access clinical records, manage inventory, and
              monitor donor screening protocols within a secure medical
              environment.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-4">
                <ShieldCheck className="mb-2 h-6 w-6" />
                <h3 className="text-sm font-bold">Encrypted Access</h3>
                <p className="text-xs opacity-70">
                  End-to-end clinical data protection.
                </p>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <BarChart3 className="mb-2 h-6 w-6" />
                <h3 className="text-sm font-bold">Real-time Logs</h3>
                <p className="text-xs opacity-70">
                  Full audit trail for all activities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Login Form Section (Right) ── */}
        <section className="flex flex-1 flex-col justify-center bg-card p-8 md:w-5/12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile header */}
            <div className="flex flex-col items-center md:hidden">
              <Droplets className="mb-4 h-14 w-14 text-primary" />
              <h1 className="text-2xl leading-8 font-semibold tracking-tight text-foreground">
                Makati Milk Bank
              </h1>
              <p className="mb-8 text-sm font-medium tracking-wider text-muted-foreground uppercase">
                Clinical Staff Portal
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>

            {/* Footer links */}
            <div className="mt-8 flex justify-center gap-6">
              <a className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Help Center
              </a>
              <span className="text-border">|</span>
              <a className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Privacy Policy
              </a>
              <span className="text-border">|</span>
              <a className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Support
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-border bg-card px-6 py-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            &copy; 2024 Makati Milk Bank Management System. Clinical Staff
            Portal.
          </p>
        </div>
        <div className="flex gap-4">
          <a className="text-xs text-muted-foreground underline transition-colors hover:text-primary">
            Privacy Policy
          </a>
          <a className="text-xs text-muted-foreground underline transition-colors hover:text-primary">
            Terms of Service
          </a>
          <a className="flex items-center gap-1 text-xs text-muted-foreground underline transition-colors hover:text-primary">
            <Shield className="h-3 w-3" />
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
