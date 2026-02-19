"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const tools = [
    { name: "Instagram Bot", id: "tool-1" },
    { name: "Tool 2", id: "tool-2" },
    { name: "Tool 3", id: "tool-3" },
]

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
    onLinkClick?: () => void
    hideHeader?: boolean
}

export function SidebarContent({ className, onLinkClick, hideHeader = false, ...props }: SidebarContentProps) {
    const pathname = usePathname()

    return (
        <div className={cn("flex h-full w-full flex-col bg-background text-foreground", className)} {...props}>
            {!hideHeader && (
                <div className="flex h-14 items-center border-b px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
                        <div className="relative h-8 w-8">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <span>Dashboard</span>
                    </Link>
                </div>
            )}
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Tools
                    </div>
                    {tools.map((tool) => (
                        <Link
                            key={tool.id}
                            href={`/dashboard/chat/${tool.id}`}
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent hover:text-accent-foreground",
                                pathname === `/dashboard/chat/${tool.id}`
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            <MessageSquare className="h-4 w-4" />
                            {tool.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    )
}
