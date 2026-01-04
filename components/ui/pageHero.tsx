"use client";

import ReusableSheet from "../reusable components/reusable-sheet";
import {FilesIcon, Moon, Plus, Sun, Sunrise, Sunset} from "lucide-react";
import ReusableTooltip from "../reusable components/reusable-tooltip";
import {DayCloudyIcon} from "@/components/icons";
import React, {JSX} from "react";

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
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          {type !== "hero" && getTimeBasedIcon()}
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-row gap-2">
        {showButton &&
          <ReusableSheet
            trigger={<div className="btn-primary flex flex-row p-1.5 pe-2 rounded-lg text-sm "><Plus className="size-4" />{buttonText}</div>}
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
            trigger={<ReusableTooltip trigger={<FilesIcon className="cursor-pointer" />} tooltip="Bulk Upload" />}
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

export function getTimeBasedIcon(
    date: Date = new Date()
): JSX.Element {
  const hour = date.getHours();

  // 🌙 Night: 19 → 04
  if (hour >= 19 || hour < 5) {
    return <Moon className="size-6" />;
  }

  // 🌅 Sunrise: 05 → 08
  if (hour >= 5 && hour < 9) {
    return <DayCloudyIcon className="size-7" />;
  }

  // ☀️ Day: 09 → 16
  if (hour >= 9 && hour < 17) {
    return <Sun className="size-6" />;
  }

  // 🌇 Sunset: 17 → 18
  return <Sunset className="size-7" />;
}
