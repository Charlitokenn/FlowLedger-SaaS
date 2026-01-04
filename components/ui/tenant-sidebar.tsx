'use client';

import { memo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { SIDEBAR_MENU_ITEMS } from '@/lib/constants';
import { NavMain } from './nav-main';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MoonIcon, SunIcon } from '../icons';
import ClerkOrganizationManager from "@/components/organizationSwitcher";

interface Props {
  userName?: string;
  logo?: string;
  orgName?: string;
  role?: string;
}
  
export const TenantSidebar = memo(({logo, orgName, role} : Props ) => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="cursor-default flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                { role === "admin"
                    ? <ClerkOrganizationManager />
                    : <Image src={logo} alt={`${orgName} logo`} width='44' height='44' className="rounded-sm"/>
                }
                <div className="flex flex-col">
                  <span className="text-md font-semibold leading-none">
                    {orgName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {role === "member" ? "Staff" : "Admin"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={SIDEBAR_MENU_ITEMS.TENANTS_MENU} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});

TenantSidebar.displayName = 'TenantSidebar';