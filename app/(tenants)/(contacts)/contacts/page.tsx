import { ReusableDataTable } from "@/components/data-table/reusable-data-table";
import AddContactForm from "@/components/forms/contacts-form";
import PageHero from "@/components/ui/pageHero";
import VerticalTabs from "@/components/reusable-vertical-tabs";
import { BoxIcon, Store, Users } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "Contacts",
  },
};

const ContactsPage = async ({ sessionClaims }: { sessionClaims: any }) => {
  // const { success, data, error } = await GetAllContacts();
  const columns = [
    {
      id: "fullName",
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      id: "mobileNumber",
      accessorKey: "mobileNumber",
      header: "Mobile Number",
    },
  ];

  if (success) {
    if (success) {
      // Data fetched successfully
    } else {
      throw new Error(error || "Failed to fetch contacts");
    }
  } else {
    throw new Error(error || "Failed to fetch contacts");
  }

  return (
    <section>
      <PageHero
        type="hero"
        title="Contacts"
        subtitle={`Here you can manage all contacts`}
        showButton
        buttonText="New Contact"
        dialogTitle="New Contact"
        dialogDescription="Fill out the form below to create a new contact."
        dialog={<AddContactForm />}
      />
      <ReusableDataTable data={data ?? []} pageCount={10} columns={columns} />
    </section>
  )
}

export default ContactsPage