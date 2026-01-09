import PageHero from "@/components/ui/pageHero";
import { GetAllProjects } from "@/lib/actions/tenants/projects.actions";
import { Metadata } from "next";
import { ProjectsTable } from "./columns"
import { AddProjectsForm } from "@/components/forms/projects/add-projects-form";
import ProjectsBulkUpload from "@/components/forms/projects/projects-bulk-upload";
import appConfig from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${appConfig.appDetails.brand}`,
    default: "Projects",
  },
};

const ProjectsPage = async () => {
  const results = await GetAllProjects();

  return (
    <section>
      <PageHero
        type="hero"
        title="Projects"
        subtitle={`Here you can manage all your projects `}
        showButton
        buttonText="New Project"
        sheetTitle="New project"
        sheetContent={<AddProjectsForm />}
        bulkUploader={<ProjectsBulkUpload />}
        showBulkUploader
        hideBulkUploaderHeader={true}
        hideBulkUploaderFooter={true}
        bulkUploaderClass="max-w-full"
        hideSheetHeader={true}
        hideSheetFooter={true}
        sheetSaveButtonText="Save Project"
        sheetSizeClass="max-w-full"
      />
      <ProjectsTable data={results.data ?? []} />
    </section>
  )
}

export default ProjectsPage
