"use client"

import z from "zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  MultiStepForm,
  type FormSelectOption,
  type FormStep,
} from "@/components/reusable components/reusable-multistep-form";
import { useToast } from "@/components/reusable components/toast-context";
import { useSheetControl } from "@/components/reusable components/reusable-sheet";
import { getLocationsDataset } from "@/lib/actions/catalog/location-options.actions";
import { UpdateProject } from "@/lib/actions/tenants/projects.actions";
import type { Project } from "@/database/tenant-schema";

const projectDetailsSchema = z.object({
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  region: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  street: z.string().optional(),
  sqmBought: z.string().min(1, "Square meters bought must be at least 100"),
  numberOfPlots: z.string().min(1, "There must be at least 1 plot"),
  projectOwner: z.string().optional(),
});

const acquisitionDetailsSchema = z.object({
  acquisitionDate: z
    .date()
    .refine((date) => date <= new Date(), "Acquisition date must be on or before today"),
  acquisitionValue: z.string().min(1, "Acquisition value must be at least 1,000"),
  commitmentAmount: z.string().optional(),
  supplierName: z.string().optional()
});

const documentationSchema = z.object({
  tpStatus: z.enum(["In Progress", "Approved"], "Invalid TP status").default("In Progress"),
  surveyStatus: z.enum(["In Progress", "Approved"], "Invalid Survey status").default("In Progress"),
  tpNumber: z.string().optional(),
  surveyNumber: z.string().optional(),
  contractStatus: z.enum(["On File", "Unavailable"], "Invalid Contract status").default("On File").optional(),
  contractDate: z.date().optional(),
  originalContract: z.instanceof(File).optional(),
  tpDocument: z.instanceof(File).optional(),
  surveyDocument: z.instanceof(File).optional(),
});

const localGovtSchema = z.object({
  mwenyekitiName: z.string().optional(),
  mwenyekitiMobile: z.string().optional(),
  mtendajiName: z.string().optional(),
  mtendajiMobile: z.string().optional(),
  localGovtFee: z.coerce.number().optional(),
});

const statusOptions = [
  { label: "In Progress", value: "In Progress" },
  { label: "Approved", value: "Approved" },
] as const;

const contractStatusOptions = [
  { label: "On File", value: "On File" },
  { label: "Unavailable", value: "Unavailable" },
] as const;

type LocationsState = {
  regions: FormSelectOption[];
  districtsByRegion: Record<string, FormSelectOption[]>;
};

const stepsBase: FormStep[] = [
  {
    id: "project",
    title: "Project Info",
    description: "Details about the project",
    schema: projectDetailsSchema,
    fields: [
      { name: "projectName", label: "Project Name", type: "text", placeholder: "Buyuni Project" },
      { name: "region", label: "Region", type: "select", placeholder: "Select region", options: [] },
      {
        name: "district",
        label: "District",
        type: "select",
        placeholder: "Select district",
        dependsOn: "region",
        options: [],
      },
      { name: "ward", label: "Ward", type: "text", placeholder: "Gulubwida" },
      { name: "street", label: "Street", type: "text", placeholder: "Gulubwida" },
      { name: "sqmBought", label: "Square Meters Bought", type: "number", placeholder: "1000" },
      { name: "numberOfPlots", label: "Number of Plots", type: "number", placeholder: "10" },
      { name: "projectOwner", label: "Project Owner", type: "text", placeholder: "John Mcharo" },
    ],
    columns: 3,
  },
  {
    id: "acquisition",
    title: "Acquisition Details",
    description: "Details about the acquisition",
    schema: acquisitionDetailsSchema,
    fields: [
      { name: "acquisitionDate", label: "Acquisition Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "acquisitionValue", label: "Acquisition Value", type: "number", placeholder: "10000" },
      { name: "supplierName", label: "Supplier Name", type: "text", placeholder: "Juma Salim" },
      { name: "commitmentAmount", label: "Commitment Amount", type: "number", placeholder: "5000" },
    ],
    columns: 2,
  },
  {
    id: "documentation",
    title: "Documentation",
    description: "Upload project documentation",
    schema: documentationSchema,
    fields: [
      { name: "tpStatus", label: "TP Status", type: "select", placeholder: "Select TP status", options: [...statusOptions] },
      { name: "tpNumber", label: "TP Number", type: "text", placeholder: "TP12345" },
      { name: "tpDocument", label: "TP Document", type: "file" },
      { name: "surveyStatus", label: "Survey Status", type: "select", placeholder: "Select Survey status", options: [...statusOptions] },
      { name: "surveyNumber", label: "Survey Number", type: "text", placeholder: "SURV12345" },
      { name: "surveyDocument", label: "Survey Document", type: "file" },
      { name: "contractStatus", label: "Contract Status", type: "select", options: [...contractStatusOptions], placeholder: "Select Contract status" },
      { name: "contractDate", label: "Contract Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "originalContract", label: "Original Contract", type: "file" },
    ],
    columns: 3,
  },
  {
    id: "localGovt",
    title: "Local Government",
    description: "Local government details",
    schema: localGovtSchema,
    fields: [
      { name: "mwenyekitiName", label: "Mwenyekiti Name", type: "text", placeholder: "John Doe" },
      { name: "mwenyekitiMobile", label: "Mwenyekiti Mobile", type: "phone", placeholder: "255700123456" },
      { name: "mtendajiName", label: "Mtendaji Name", type: "text", placeholder: "Jane Smith" },
      { name: "mtendajiMobile", label: "Mtendaji Mobile", type: "phone", placeholder: "255700123456" },
      { name: "localGovtFee", label: "Local Government Fee (TZS)", type: "number", placeholder: "10000" },
    ],
    columns: 2,
  },
];

function parseDateOnly(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string") return undefined;

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d);
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt;
}

function formatExistingUrlLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  // If it's a URL (legacy), show the last pathname segment.
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value);
      const tail = u.pathname.split("/").pop();
      return tail ? `Current: ${tail}` : "Current document uploaded";
    } catch {
      return "Current document uploaded";
    }
  }

  // Otherwise assume it's an R2 object key like "Contracts/<projectId>/<file>.pdf".
  const tail = value.split("/").pop();
  return tail ? `Current: ${tail}` : "Current document uploaded";
}

type EditProjectFormProps = {
  project: Project;
};

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const { showToast } = useToast();
  const sheet = useSheetControl();
  const [, startTransition] = useTransition();

  const [locations, setLocations] = useState<LocationsState>({
    regions: [],
    districtsByRegion: {},
  });

  useEffect(() => {
    startTransition(async () => {
      const res = await getLocationsDataset();
      if (!res.success) return;

      setLocations({
        regions: res.data.regions,
        districtsByRegion: res.data.districtsByRegion,
      });
    });
  }, []);

  const stepsWithLocations = useMemo<FormStep[]>(() => {
    const regionOpts = locations.regions;

    return stepsBase.map((s) => {
      if (s.id !== "project") return s;

      return {
        ...s,
        fields: s.fields.map((f) => {
          if (f.type !== "select") return f;

          if (f.name === "region") {
            return { ...f, options: regionOpts };
          }

          if (f.name === "district") {
            return {
              ...f,
              options: (values) => {
                const region = values.region as string | undefined;
                return region ? locations.districtsByRegion[region] ?? [] : [];
              },
            };
          }

          return f;
        }),
      };
    });
  }, [locations.districtsByRegion, locations.regions]);

  const stepsForEdit = useMemo<FormStep[]>(() => {
    return stepsWithLocations.map((s) => {
      if (s.id !== "documentation") return s;

      return {
        ...s,
        fields: s.fields.map((f) => {
          if (f.type !== "file") return f;

          if (f.name === "originalContract") {
            return { ...f, description: formatExistingUrlLabel(project.originalContractPdf) };
          }

          if (f.name === "tpDocument") {
            return { ...f, description: formatExistingUrlLabel(project.tpUrl) };
          }

          if (f.name === "surveyDocument") {
            return { ...f, description: formatExistingUrlLabel(project.surveyUrl) };
          }

          return f;
        }),
      };
    });
  }, [project.originalContractPdf, project.tpUrl, project.surveyUrl, stepsWithLocations]);

  const initialData = useMemo(() => {
    return {
      // Project
      projectName: project.projectName ?? "",
      region: project.region ?? "",
      district: project.district ?? "",
      ward: project.ward ?? "",
      street: project.street ?? "",
      sqmBought: project.sqmBought != null ? String(project.sqmBought) : "",
      numberOfPlots: project.numberOfPlots != null ? String(project.numberOfPlots) : "",
      projectOwner: project.projectOwner ?? "",

      // Acquisition
      acquisitionDate: parseDateOnly(project.acquisitionDate),
      acquisitionValue: project.acquisitionValue != null ? String(project.acquisitionValue) : "",
      commitmentAmount: project.committmentAmount != null ? String(project.committmentAmount) : "",
      supplierName: project.supplierName ? String(project.supplierName) : "",

      // Documentation
      tpStatus: (project.tpStatus as string) ?? "In Progress",
      tpNumber: project.tpNumber ?? "",
      surveyStatus: (project.surveyStatus as string) ?? "In Progress",
      surveyNumber: project.surveyNumber ?? "",

      // NOTE: File inputs cannot be prefilled for security.
      // originalContract / tpDocument / surveyDocument are intentionally omitted.

      // Local govt
      mwenyekitiName: project.mwenyekitiName ?? "",
      mwenyekitiMobile: project.mwenyekitiMobile ?? "",
      mtendajiName: project.mtendajiName ?? "",
      mtendajiMobile: project.mtendajiMobile ?? "",
      localGovtFee: project.lgaFee != null ? Number(project.lgaFee) : undefined,
    };
  }, [project]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    const fd = new FormData();

    fd.append("projectId", project.id);

    const appendIfString = (key: string, value: unknown) => {
      if (typeof value === "string") fd.append(key, value);
    };

    const appendIfNumber = (key: string, value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        fd.append(key, value.toString());
      }
    };

    const formatLocalYmd = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const appendIfDate = (key: string, value: unknown) => {
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        // Avoid toISOString() UTC shift.
        fd.append(key, formatLocalYmd(value));
      }
    };

    const appendIfFile = (key: string, value: unknown) => {
      if (value instanceof File && value.size > 0) {
        fd.append(key, value);
        return;
      }
      if (Array.isArray(value) && value[0] instanceof File) {
        const first = value[0] as File;
        if (first.size > 0) fd.append(key, first);
      }
    };

    // Project
    appendIfString("projectName", data.projectName);
    appendIfString("region", data.region);
    appendIfString("district", data.district);
    appendIfString("ward", data.ward);
    appendIfString("street", data.street);
    appendIfString("sqmBought", data.sqmBought);
    appendIfString("numberOfPlots", data.numberOfPlots);
    appendIfString("projectOwner", data.projectOwner);

    // Acquisition
    appendIfDate("acquisitionDate", data.acquisitionDate);
    appendIfString("acquisitionValue", data.acquisitionValue);
    appendIfString("commitmentAmount", data.commitmentAmount);
    appendIfString("supplierName", data.supplierName);

    // Docs (optional replacements)
    appendIfString("tpStatus", data.tpStatus);
    appendIfString("tpNumber", data.tpNumber);
    appendIfFile("tpDocument", data.tpDocument);
    appendIfString("surveyStatus", data.surveyStatus);
    appendIfString("surveyNumber", data.surveyNumber);
    appendIfFile("surveyDocument", data.surveyDocument);
    appendIfFile("originalContract", data.originalContract);

    // Local govt
    appendIfString("mwenyekitiName", data.mwenyekitiName);
    appendIfString("mwenyekitiMobile", data.mwenyekitiMobile);
    appendIfString("mtendajiName", data.mtendajiName);
    appendIfString("mtendajiMobile", data.mtendajiMobile);
    appendIfNumber("localGovtFee", data.localGovtFee);

    const res = await UpdateProject(fd);
    if (!res.success) {
      showToast({
        title: "Failed to update project",
        description: res.error,
        variant: "error",
        showAction: false,
      });
      throw new Error(res.error);
    }
  };

  return (
    <MultiStepForm
      steps={stepsForEdit}
      initialData={initialData}
      onSubmit={handleSubmit}
      submitButtonText="Save changes"
      submittingButtonText="Saving..."
      stepperOrientation="vertical"
      onComplete={() => {
        showToast({
          title: "Project updated",
          description: "Changes saved successfully.",
          variant: "success",
          showAction: false,
        });
        sheet?.close();
      }}
    />
  );
}
