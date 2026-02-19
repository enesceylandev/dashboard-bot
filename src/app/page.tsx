"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - just redirect to dashboard
    router.push("/dashboard")
  }

  return (
    <section className="h-screen bg-muted w-full">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          <Link href="https://www.shadcnblocks.com">
            <Image
              alt="logo"
              title="shadcnblocks.com"
              className="h-10 dark:invert"
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg"
              width={200}
              height={40}
            />
          </Link>
          <div className="flex w-full max-w-sm min-w-sm flex-col items-center gap-y-4 rounded-md border border-muted bg-background px-6 py-8 shadow-md">
            <h1 className="text-xl font-semibold">Login</h1>
            <form onSubmit={handleLogin} className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Email"
                  required
                  type="email"
                />
              </div>
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Password"
                  required
                  type="password"
                />
              </div>
              <Button type="submit" className="w-full mt-2">
                Login
              </Button>
            </form>
            <div className="flex justify-center gap-1 text-sm text-muted-foreground">
              <p>Need an account?</p>
              <Link href="https://shadcnblocks.com" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
