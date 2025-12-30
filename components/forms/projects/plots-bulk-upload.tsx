"use client";

import { ReusableCSVUploader, type CsvFieldConfig } from "@/components/reusable components/reusable-csv-uploader";
import { useSheetControl } from "@/components/reusable components/reusable-sheet";
import { BulkUpdatePlotsForProject } from "@/lib/actions/tenants/plots.actions";
import { useRouter } from "next/navigation";

type PlotCsvUpdateRow = {
  plotNumber: number;
  surveyedPlotNumber?: string | null;
  availability?: "AVAILABLE" | "SOLD" | null;
  unsurveyedSize?: number | null;
  surveyedSize?: number | null;
  contactId?: string | null;
};

const plotFields: CsvFieldConfig<PlotCsvUpdateRow>[] = [
  {
    key: "plotNumber",
    label: "Plot Number",
    required: true,
    type: "number",
    description: "Must match existing plot no. for updates",
  },
  {
    key: "surveyedPlotNumber",
    label: "Surveyed Plot Number",
    type: "string",
  },
  {
    key: "availability",
    label: "Availability",
    type: "enum",
    enumValues: ["AVAILABLE", "SOLD"],
    parse: (raw) => {
      const v = raw.trim();
      if (!v) return null;
      const upper = v.toUpperCase();
      const allowed = ["AVAILABLE", "SOLD"] as const;
      return allowed.includes(upper as (typeof allowed)[number])
        ? (upper as PlotCsvUpdateRow["availability"])
        : null;
    },
  },
  {
    key: "unsurveyedSize",
    label: "Unsurveyed Size",
    type: "number",
    description: "Required only when inserting new plots",
  },
  {
    key: "surveyedSize",
    label: "Surveyed Size",
    type: "number",
  },
  {
    key: "contactId",
    label: "Client ID",
    type: "string",
    description: "UUID of the client who bought the plot",
  },
];

export default function PlotsBulkUpload({ projectId }: { projectId: string }) {
  const sheet = useSheetControl();
  const router = useRouter();

  return (
    <ReusableCSVUploader<PlotCsvUpdateRow>
      entityName="Plots"
      fields={plotFields}
      maxFileSizeMb={5}
      onSubmit={async (rows) => {
        const res = await BulkUpdatePlotsForProject({ projectId, rows });
        if (!res.success) {
          throw new Error(res.error);
        }

        // Refresh server components so the plots table reflects latest DB state.
        router.refresh();

        sheet?.close();
      }}
    />
  );
}
