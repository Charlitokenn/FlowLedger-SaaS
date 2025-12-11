'use client'

import React, { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  formContent: React.ReactNode;
  isInset?: boolean;
  saveButtonText?: string;
  titleIcon?: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  popupClass?: string;
  /** Optional id used to programmatically trigger this sheet (e.g. from a dropdown item) */
  triggerId?: string;
}

interface SheetControlContextValue {
  close: () => void;
}

const SheetControlContext = createContext<SheetControlContextValue | null>(null);

export function useSheetControl() {
  return useContext(SheetControlContext);
}

export default function ReusableSheet({
  trigger,
  title,
  description,
  formContent,
  isInset = true,
  saveButtonText,
  titleIcon,
  hideHeader,
  hideFooter,
  popupClass,
  triggerId,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button data-sheet-trigger-id={triggerId} />}>
        {trigger}
      </SheetTrigger>
      <SheetPopup
        inset={isInset}
        className={cn(
          "p-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]",
          popupClass,
        )}
      >
        <SheetControlContext.Provider value={{ close }}>
          <SheetHeader hidden={hideHeader}>
            <SheetTitle className="flex gap-2 items-center">
              <div className="">{titleIcon}</div>
              <p>{title}</p>
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
            <Separator className="my-1" />
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            {formContent}
          </div>
          <SheetFooter hidden={hideFooter}>
            <SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
            <Button type="submit" className="cursor-pointer">{saveButtonText}</Button>
          </SheetFooter>
        </SheetControlContext.Provider>
      </SheetPopup>
    </Sheet>
  );
}
