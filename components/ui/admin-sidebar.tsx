'use client';

import { ForwardRefExoticComponent, memo, RefAttributes } from 'react';
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
  LucideIcon,
  LucideProps,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { SIDEBAR_MENU_ITEMS } from '@/lib/constants';
import { NavMain } from './nav-main';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import config from '@/lib/app-config';

interface MenuItemsType {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]

interface Props {
  userName?: string;
  logo?: string;
  orgName?: string;
  role?: string;
  menuItems?: MenuItemsType;
}
  
export const AdminSidebar = memo(({logo, orgName, role, menuItems} : Props ) => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="h-5 w-5" />
                  {logo && <Image src='/globe.svg' alt={`${orgName} logo`} width={32} height={32} />}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{config.appDetails.name}</span>
                  <span className="truncate text-xs">{role === "member" ? "Staff" : "Super Admin"} Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={SIDEBAR_MENU_ITEMS.ADMIN_MENU} pathname={pathname} />
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

AdminSidebar.displayName = 'AdminSidebar';