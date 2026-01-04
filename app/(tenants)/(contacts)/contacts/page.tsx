import AddContactForm from "@/components/forms/projects/add-contacts-form";
import ContactsCsvBulkUpload from "@/components/forms/projects/projects-bulk-upload";
import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Contacts",
  },
};

const ContactsPage = async () => {
  // TODO: integrate contacts data source and remove placeholder data.
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

  return (
    <section>
      <PageHero
        type="hero"
        title="Contacts"
        subtitle="Here you can manage all contacts"
        showButton
        buttonText="New Contact"
        sheetTitle="New Contact"
        sheetDescription="Fill out the form below to create a new contact."
        sheetContent={<AddContactForm />}
        showBulkUploader
        bulkUploader={<ContactsCsvBulkUpload />}
        bulkUploaderTitle="Bulk upload contacts"
        bulkUploaderDescription="Upload a CSV file and map its columns to contact fields."
        bulkUploaderClass="max-w-5xl w-full"
        hideBulkUploaderFooter
      />
    </section>
  );
}

export default ContactsPage