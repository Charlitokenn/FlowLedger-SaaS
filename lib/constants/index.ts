import { ArchiveIcon, CartIcon, ClientsIcon, CogIcon, HomeIcon, MessageIcon, StoreIcon, WalletIcon } from "@/components/icons";

export const SIDEBAR_MENU_ITEMS = {
  TENANTS_MENU: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: ClientsIcon,
    },
    {
      title: "Sales",
      url: "#",
      icon: CartIcon,
      items: [
        {
          title: "Contracts",
          url: "/contracts",
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
      icon: WalletIcon,
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
      url: "/projects",
      icon: ArchiveIcon,
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: StoreIcon,
    },
    {
      title: "Messaging",
      url: "/messaging",
      icon: MessageIcon,
    },
  ],
  ADMIN_MENU: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: ClientsIcon,
    },
    {
      title: "Revenue",
      url: "/revenue",
      icon: WalletIcon,
    },
    {
      title: "Integrations",
      url: "#",
      icon: CogIcon,
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