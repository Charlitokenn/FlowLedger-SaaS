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
              <Link prefetch={false} href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="h-5 w-5" />
                  {logo && <Image src={logo} alt={`${orgName} logo`} width={32} height={32} />}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{orgName}</span>
                  <span className="truncate text-xs">{role === "member" ? "Staff" : "Admin"} Panel</span>
                </div>
              </Link>
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
              {theme === 'dark' ? <Sun /> : <Moon />}
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