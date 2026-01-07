import {
  ArchiveIcon,
  CartIcon,
  ClientsIcon,
  CogIcon,
  HomeIcon,
  MessageIcon,
  StoreIcon,
  WalletIcon,
} from "@/components/icons";
import MpesaIcon from "@/public/m-pesa_logo.png";
import AirtelIcon from "@/public/airtel_money_logo.png";
import YasIcon from "@/public/yas_logo.jpg";
import HalotelIcon from "@/public/halopesa_logo.png";

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

export const PricingTiers = [
  { minSms: 1, price: 21, name: "Package A" },
  { minSms: 6000, price: 20, name: "Package B" },
  { minSms: 55000, price: 19, name: "Package C" },
  { minSms: 410000, price: 18, name: "Package D" },
]

export const TelcoOperators = [
  { id: "mpesa", name: "Mpesa", icon: MpesaIcon },
  { id: "airtel", name: "Airtel", icon: AirtelIcon },
  { id: "tigo", name: "Mixx by Yas", icon: YasIcon },
  { id: "halo", name: "HaloPesa", icon: HalotelIcon },
]

export const RelationshipOptions = [
  { label: "Parent", value: "PARENT" },
  { label: "Relative", value: "SIBLING" },
  { label: "Spouse", value: "SPOUSE" },
  { label: "Friend", value: "FRIEND" },
  { label: "Other", value: "OTHER" },
]

export const IDOptions = [
  { label: "National ID", value: "NATIONAL_ID" },
  { label: "Passport", value: "PASSPORT" },
  { label: "Driver License", value: "DRIVER_LICENSE" },
  { label: "Voter's ID", value: "VOTER_ID" },
]