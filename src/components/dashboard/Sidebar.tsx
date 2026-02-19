"use client"

import { SidebarContent } from "@/components/dashboard/SidebarContent"

export function Sidebar() {
    return (
        <div className="hidden border-r md:flex h-full w-64 flex-col">
            <SidebarContent />
        </div>
    )
}
