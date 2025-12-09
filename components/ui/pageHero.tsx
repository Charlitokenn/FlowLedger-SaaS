"use client";

import ReusableSheet from "../reusable components/reusable-sheet";
import { Plus } from "lucide-react";

type PageHeroProps = {
  title?: string;
  subtitle: string;
  type: "greeting" | "hero";
  buttonText?: string;
  showButton?: boolean;
  sheetContent: React.ReactNode
  sheetTitle: string
  sheetDescription?: string
  sheetIcon?: React.ReactNode
  sheetSaveButtonText?: string
  hideSheetHeader?: boolean
  hideSheetFooter?: boolean
  sheetSizeClass?: string
};

const PageHero = ({
  title,
  subtitle,
  type,
  buttonText,
  showButton,
  sheetContent,
  sheetTitle,
  sheetDescription,
  sheetIcon,
  sheetSaveButtonText,
  hideSheetHeader,
  hideSheetFooter,
  sheetSizeClass
}: PageHeroProps) => {

  //TODO - ADD a bulk add functionality
  return (
    <div className="flex items-center justify-between gap-4 -mt-3 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {type === "hero" ? title : `Hello`}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {showButton &&
        <ReusableSheet
          trigger={<div className="cursor-pointer flex flex-row p-1.5 pe-2 rounded-lg border text-sm items-center "><Plus className="size-5" />{buttonText}</div>}
          title={sheetTitle}
          description={sheetDescription}
          titleIcon={sheetIcon}
          formContent={sheetContent}
          saveButtonText={sheetSaveButtonText}
          hideHeader={hideSheetHeader}
          hideFooter={hideSheetFooter}
          popupClass={sheetSizeClass}
        />
      }
    </div>
  );
};

export default PageHero;
