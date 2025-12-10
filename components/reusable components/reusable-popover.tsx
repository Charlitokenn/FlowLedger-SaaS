import { Popover, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger } from '../ui/popover'

interface Props {
    trigger: React.ReactNode;
    title?: string;
    description?: string;
    content?: React.ReactNode
    popoverClass?: string
    /** Optional id used to programmatically trigger this popover (e.g. from a dropdown item) */
    triggerId?: string;
}

const ReusablePopover = ({ trigger, title, description, content, popoverClass, triggerId }: Props) => (
  <Popover>
    <PopoverTrigger render={<div data-popover-trigger-id={triggerId} />}>
      {trigger}
    </PopoverTrigger>
    <PopoverPopup className={popoverClass}>
      <div className="mb-4">
        <PopoverTitle className="text-base">{title}</PopoverTitle>
        <PopoverDescription>
          {description}
        </PopoverDescription>
      </div>
      {content}
    </PopoverPopup>
  </Popover>
)

export default ReusablePopover