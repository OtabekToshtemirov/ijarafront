import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "./StoreProvider";
import { Toaster } from 'sonner';

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});

const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <StoreProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem={true}
                        themes={["light", "dark"]}
                    >
                        <SidebarProvider>
                            <AppSidebar />
                            <main className="min-h-screen bg-background p-8 w-full">
                                <SidebarTrigger />
                                {children}
                            </main>
                            <Toaster richColors position="top-right" />
                        </SidebarProvider>
                    </ThemeProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
