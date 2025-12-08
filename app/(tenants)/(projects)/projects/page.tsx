import PageHero from "@/components/ui/pageHero";
import { GetAllProjects } from "@/lib/actions/tenants/projects.actions";
import { Metadata } from "next";
import { ProjectsTable } from "./columns"
import MultiStepForm from "@/components/forms/projects-form";

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
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
        sheetContent={<MultiStepForm />}
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