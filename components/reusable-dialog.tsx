import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

interface Props {
    trigger: React.ReactNode
    title?: string;
    description?: React.ReactNode
    dialog?: React.ReactNode
    hideDialogFooter?: boolean
}

const ReusableDialog = ({ trigger, title, description, dialog,hideDialogFooter = true }: Props) => (
<Dialog>
  <DialogTrigger>{trigger}</DialogTrigger>
  <DialogPopup className="sm:max-w-sm">
    <DialogHeader>
      <DialogTitle className="-my-1">{title}</DialogTitle>
      <Separator className="my-2.5"/>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
      <div className="px-6">
        {dialog}
      </div>
      
    <DialogFooter hidden={hideDialogFooter}>
      <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
    </DialogFooter>    
  </DialogPopup>
</Dialog>
)

export default ReusableDialog