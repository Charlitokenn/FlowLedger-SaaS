import AddContactForm from "@/components/forms/contacts/add-contact-form";
import ContactsCsvBulkUpload from "@/components/forms/projects/projects-bulk-upload";
import PageHero from "@/components/ui/pageHero";
import { Metadata } from "next";
import appConfig from "@/lib/app-config";
import {ContactsTable} from "@/app/(tenants)/(contacts)/contacts/columns";
import {GetAllContacts} from "@/lib/actions/tenants/contacts.actions";
import {auth} from "@clerk/nextjs/server";
import type {SessionClaims} from "@/types/auth";
import {getCurrentTenantFromCatalog} from "@/lib/actions/catalog/settings.actions";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Contacts",
  },
};

const ContactsPage = async () => {
  const { sessionClaims } = await auth();
  const claims = sessionClaims as SessionClaims | null;
  const url = claims?.orgLogo as string;
  const orgName = claims?.orgName as string;

  const { data } = await getCurrentTenantFromCatalog()

  const tenantBrand = { logo: url, tenantName: orgName, tenantBranding: data }

  const results = await GetAllContacts();

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
        sheetSizeClass="max-w-3xl w-full"
        hideSheetHeader={true}
        hideSheetFooter={true}
        showBulkUploader
        bulkUploader={<ContactsCsvBulkUpload />}
        bulkUploaderTitle="Bulk upload contacts"
        bulkUploaderDescription="Upload a CSV file and map its columns to contact fields."
        bulkUploaderClass="max-w-5xl w-full"
        hideBulkUploaderFooter
      />
        <ContactsTable data={results.data ?? []} extra={tenantBrand}/>
    </section>
  );
}

export default ContactsPage