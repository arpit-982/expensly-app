import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  CreditCard,
  FileText,
  Upload,
  Filter,
  Building,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "next-themes";
import { useCurrency, popularCurrencies } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Ledger Files", url: "/ledger", icon: FileText },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Rules", url: "/rules", icon: Filter },
  { title: "Accounts", url: "/accounts", icon: Building },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-accent/50";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Expensly</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavClass}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Theme and Currency Controls */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="space-y-2 p-2">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                {!collapsed && <span className="text-sm text-muted-foreground">Theme</span>}
                <div className="relative h-8 w-16 rounded-full bg-muted p-1 transition-colors">
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`absolute top-1 h-6 w-6 rounded-full bg-background shadow-sm transition-all duration-200 ${
                      theme === "dark" ? "left-9" : "left-1"
                    }`}
                  />
                  <div className="flex h-full items-center justify-between px-1">
                    <Sun className={`h-3 w-3 transition-colors ${
                      theme === "light" ? "text-foreground" : "text-muted-foreground"
                    }`} />
                    <Moon className={`h-3 w-3 transition-colors ${
                      theme === "dark" ? "text-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                </div>
              </div>

              {/* Currency Dropdown */}
              <div className="flex items-center justify-between">
                {!collapsed && <span className="text-sm text-muted-foreground">Currency</span>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-16 justify-between"
                    >
                      <span className="text-xs">{selectedCurrency.symbol}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {popularCurrencies.map((currency) => (
                      <DropdownMenuItem
                        key={currency.code}
                        onClick={() => setSelectedCurrency(currency)}
                        className="flex items-center gap-2"
                      >
                        <span className="font-medium">{currency.symbol}</span>
                        <span className="text-sm">{currency.code}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {currency.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}