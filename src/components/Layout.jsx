import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, FileText, LogOut, Settings, CreditCard, Menu, X, FileSpreadsheet, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Layout({ children }) {
    const { logout, currentUser } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        if (!currentUser) return;
        const fetchCompanyName = async () => {
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().companyProfile?.companyName) {
                    setCompanyName(docSnap.data().companyProfile.companyName);
                }
            } catch (err) { /* silently fail */ }
        };
        fetchCompanyName();
    }, [currentUser]);

    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/invoices", label: "Invoices", icon: FileText },
        { href: "/quotations", label: "Quotations", icon: FileSpreadsheet },
        { href: "/payments", label: "Payments", icon: CreditCard },
        { href: "/parties", label: "Parties", icon: Users },
        { href: "/products", label: "Products", icon: Package },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/about", label: "About Us", icon: Info },
    ];

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-background flex overflow-x-hidden max-w-full">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center justify-between px-4 z-40">
                <span className="text-lg font-bold text-foreground truncate max-w-[70%]">
                    {companyName || "Billit"}
                </span>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
                </button>
            </div>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                style={{ backgroundColor: 'hsl(var(--sidebar))' }}
                className={cn(
                    "w-64 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out",
                    "lg:left-0 lg:right-auto lg:translate-x-0 lg:border-r lg:border-border",
                    "right-0 border-l border-border",
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex items-center justify-start h-20 px-6 overflow-hidden">
                    <Link to="/" className="flex items-center justify-start w-full h-full">
                        <img src="/logo.png" alt="Bharat Bill" className="w-[85%] h-auto scale-95 origin-left drop-shadow-sm light-logo" />
                        <img src="/darkmodelogo.png" alt="Bharat Bill" className="w-[85%] h-auto scale-125 origin-left drop-shadow-sm dark-logo" />
                    </Link>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={closeMobileMenu}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-primary/90"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <Icon className={cn(
                                    "h-[18px] w-[18px] flex-shrink-0",
                                    isActive ? "text-white" : "text-muted-foreground"
                                )} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 mt-auto mb-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-11 px-3 transition-all rounded-lg text-[15px] font-medium font-sans"
                        onClick={() => {
                            closeMobileMenu();
                            logout();
                        }}
                    >
                        <LogOut className="h-[18px] w-[18px] mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-6 p-4 lg:p-8 bg-background text-foreground overflow-x-hidden w-full">
                {children}
            </main>
        </div>
    );
}
