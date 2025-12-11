"use client";

import { BulkUploadIcon } from "../icons";
import ReusableSheet from "../reusable components/reusable-sheet";
import { Plus } from "lucide-react";
import ReusableTooltip from "../reusable components/reusable-tooltip";

type PageHeroProps = {
  title?: string;
  subtitle: string;
  type: "greeting" | "hero";
  buttonText?: string;
  showButton?: boolean;
  showBulkUploader?: boolean;
  bulkUploader?: React.ReactNode;
  bulkUploaderClass?: string;
  bulkUploaderTitle?: string;
  bulkUploaderDescription?: string;
  bulkUploaderSaveButtonText?: string;
  hideBulkUploaderHeader?: boolean;
  hideBulkUploaderFooter?: boolean;
  /** Content rendered inside the sheet when showButton is true */
  sheetContent?: React.ReactNode;
  sheetTitle?: string;
  sheetDescription?: string;
  sheetIcon?: React.ReactNode;
  sheetSaveButtonText?: string;
  hideSheetHeader?: boolean;
  hideSheetFooter?: boolean;
  sheetSizeClass?: string;
};

const PageHero = ({
  title,
  subtitle,
  type,
  buttonText,
  showButton = false,
  showBulkUploader = false,
  bulkUploader,
  bulkUploaderClass,
  bulkUploaderTitle,
  bulkUploaderDescription,
  bulkUploaderSaveButtonText,
  hideBulkUploaderHeader,
  hideBulkUploaderFooter,
  sheetContent,
  sheetTitle,
  sheetDescription,
  sheetIcon,
  sheetSaveButtonText,
  hideSheetHeader,
  hideSheetFooter,
  sheetSizeClass,
}: PageHeroProps) => {

  return (
    <div className="flex items-center justify-between gap-4 -mt-3 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {type === "hero" ? title : `Hello`}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-row gap-2">
        {showButton &&
          <ReusableSheet
            trigger={<div className="cursor-pointer flex flex-row p-1.5 pe-2 rounded-lg border dark:border-primary-foreground text-sm items-center "><Plus className="size-5" />{buttonText}</div>}
            title={sheetTitle ?? ""}
            description={sheetDescription}
            titleIcon={sheetIcon}
            formContent={sheetContent}
            saveButtonText={sheetSaveButtonText}
            hideHeader={hideSheetHeader}
            hideFooter={hideSheetFooter}
            popupClass={sheetSizeClass}
          />
        }
        {showBulkUploader &&
          <ReusableSheet
            trigger={<ReusableTooltip trigger={<BulkUploadIcon className="size-7.5 cursor-pointer" />} tooltip="Bulk Upload" />}
            title={bulkUploaderTitle ?? ""}
            description={bulkUploaderDescription}
            titleIcon={sheetIcon}
            formContent={bulkUploader}
            saveButtonText={bulkUploaderSaveButtonText}
            hideHeader={hideBulkUploaderHeader}
            hideFooter={hideBulkUploaderFooter}
            popupClass={bulkUploaderClass}
          />
        }
      </div>
    </div>
  );
};

export default PageHero;
