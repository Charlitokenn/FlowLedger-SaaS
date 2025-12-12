"use client";

import { ReusableCSVUploader, type CsvFieldConfig } from "@/components/reusable components/reusable-csv-uploader";
import type { NewProject } from "@/database/tenant-schema";
import { BulkImportProjects } from "@/lib/actions/tenants/projects.actions";
import { useToast } from "@/components/reusable components/toast-context";
import { useSheetControl } from "@/components/reusable components/reusable-sheet";

const projectFields: CsvFieldConfig<NewProject>[] = [
  {
    key: "projectName",
    label: "Project name",
    required: true,
    type: "string",
    description: "Name of the project",
  },
  {
    key: "projectDetails",
    label: "Project Details",
    type: "string",
  },
  {
    key: "sqmBought",
    label: "Sqm Bought",
    type: "number",
  },
  {
    key: "acquisitionValue",
    label: "Acquisition Value",
    type: "number",
    required: true,
    description: "Total value of the project acquisition",
  },
    {
    key: "acquisitionDate",
    label: "Acquisition Date",
    type: "date",
    required: true,
    description: "Project purchase date"
  },
  {
    key: "projectOwner",
    label: "Project Owner",
    type: "string",
  },
  {
    key: "region",
    label: "Region",
    type: "string",
  },
  {
    key: "district",
    label: "District",
    type: "string",
  },
  {
    key: "ward",
    label: "Ward",
    type: "string",
  },
  {
    key: "lgaFee",
    label: "Local Govt Fee",
    type: "number",
  },
  {
    key: "surveyStatus",
    label: "Survey Status",
    type: "string",
  },
  {
    key: "surveyNumber",
    label: "Survey Number",
    type: "string",
  },
  {
    key: "supplierName",
    label: "Supplier Name",
    type: "string",
  },
  {
    key: "mwenyekitiName",
    label: "Mwenyekiti Name",
    type: "string",
  },
  {
    key: "mwenyekitiMobile",
    label: "Mwenyekiti Mobile",
    type: "string",
  },
  {
    key: "mtendajiName",
    label: "Mtendaji Name",
    type: "string",
  },
  {
    key: "mtendajiMobile",
    label: "Mtendaji Mobile",
    type: "string",
  },
  {
    key: "numberOfPlots",
    label: "Number of Plots",
    type: "number",
    required: true,
    description: "Total number of plots in the project"
  },
];

export default function ProjectsBulkUpload() {
  const { showToast } = useToast();
  const sheet = useSheetControl();

  return (
    <ReusableCSVUploader<NewProject>
      entityName="Projects"
      fields={projectFields}
      maxFileSizeMb={5}
      onSubmit={async (rows) => {
        await BulkImportProjects(rows);
        // Close the surrounding sheet on success.
        sheet?.close();
      }}
    />
  );
}
