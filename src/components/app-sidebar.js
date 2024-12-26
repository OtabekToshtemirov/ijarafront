import { Home, Inbox, Search, BadgeDollarSign, PackageSearch, Car } from "lucide-react"
import Link from "next/link"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import  { ModeToggle} from "@/components/theme-toggle"

// Menu items.
const items = [
    {
        title: "Ijara",
        url: "/ijara",
        icon: Home,
    },
    {
        title: "Mijozlar",
        url: "/customers",
        icon: Inbox,
    },
    {
        title: "Mahsulotlar",
        url: "/products",
        icon: PackageSearch,
    },
    {
        title: "Mashinalar",
        url: "/cars",
        icon: Car,
    },
    {
        title: "Statistika",
        url: "/statistics",
        icon: Search,
    },
    {
        title: "To'lovlar",
        url: "/payments",
        icon: BadgeDollarSign,
    },
    {
        title: "Xarajatlar",
        url: "/expenses",
        icon: Inbox,
    }
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Ijara mahsulotlari
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <ModeToggle />
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
