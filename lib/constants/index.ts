import { Group, Users, ShoppingCart, Wallet, Archive, Store, MessagesSquare, Gauge, Cog } from "lucide-react";

export const SIDEBAR_MENU_ITEMS = {
  TENANTS_MENU: [
    {
      title: "Dashboard",
      url: "/",
      icon: Gauge,
      isActive: true,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Group,
    },
    {
      title: "Sales",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "Daily Sales",
          url: "/daily-sales",
        },
        {
          title: "Leader Board",
          url: "/leader-board",
        }
      ]
    },
    {
      title: "Finance",
      url: "#",
      icon: Wallet,
      items: [
        {
          title: "Receipts",
          url: "/receipts",
        },
        {
          title: "Expenses",
          url: "/expenses",
        },
        {
          title: "Reminder",
          url: "/reminder",
        },
        {
          title: "Client Statement",
          url: "/client-statement",
        },
        {
          title: "Reconciliation",
          url: "/reconciliation",
        },
        {
          title: "Debtor Aging",
          url: "/aging",
        },
      ],
    },
    {
      title: "Projects",
      url: "#",
      icon: Archive,
      items: [
        {
          title: "Project List",
          url: "/projects",
        },
        {
          title: "Plots",
          url: "/plots",
        },
        {
          title: "Project Payments",
          url: "/project-payments",
        },
      ],
    },
    {
      title: "Suppliers",
      url: "#",
      icon: Store,
      items: [
        {
          title: "Supplier List",
          url: "/suppliers",
        },
        {
          title: "Supplier Payments",
          url: "/supplier-payments",
        },
      ],
    },
    {
      title: "Messaging",
      url: "/messaging",
      icon: MessagesSquare,
    },
  ],
  ADMIN_MENU: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Gauge,
      isActive: true,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Users,
    },
    {
      title: "Revenue",
      url: "/revenue",
      icon: Wallet,
    },
    {
      title: "Integrations",
      url: "#",
      icon: Cog,
      items: [
        {
          title: "Bulk SMS",
          url: "/bulk-sms",
        },
        {
          title: "ClickPesa",
          url: "/clickpesa",
        }
      ]
    },
  ]
}