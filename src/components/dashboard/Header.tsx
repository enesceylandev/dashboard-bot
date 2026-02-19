
"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/dashboard/SidebarContent"

export function Header() {
    const [open, setOpen] = useState(false)

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                    <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
                        Menu
                    </div>
                    <SidebarContent onLinkClick={() => setOpen(false)} hideHeader className="bg-transparent" />
                </SheetContent>
            </Sheet>
            <div className="flex-1">
                <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">

            </div>
        </header>
    )
}
