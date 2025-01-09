import { Home, Inbox, Search, BadgeDollarSign, PackageSearch, Car, RotateCcw } from "lucide-react"
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
import { ModeToggle } from "@/components/theme-toggle"
import InteractiveCalendar from "./Calendar/Calendar"

// Menu items.
const items = [
    {
        title: "Ижара",
        url: "/ijara",
        icon: Home,
    },
    {
        title: "Қайтариш",
        url: "/ijara/returns",
        icon: RotateCcw,
    },
    {
        title: "Мижозлар",
        url: "/customers",
        icon: Inbox,
    },
    {
        title: "Мулклар",
        url: "/products",
        icon: PackageSearch,
    },
    {
        title: "Транспорт",
        url: "/cars",
        icon: Car,
    },
    {
        title: "Статистика",
        url: "/statistics",
        icon: Search,
    },
    {
        title: "Тўловлар",
        url: "/payments",
        icon: BadgeDollarSign,
    },
    {
        title: "Харажатлар",
        url: "/expenses",
        icon: Inbox,
    }
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent className="flex flex-col h-full">
                <SidebarGroup>
                    <SidebarGroupLabel>Ижара маҳсулотлари</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <ModeToggle />
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span className="ml-4 text-lg">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <div className="mt-auto px-4 pb-4">
                    <InteractiveCalendar />
                </div>
            </SidebarContent>
        </Sidebar>
    )
}
