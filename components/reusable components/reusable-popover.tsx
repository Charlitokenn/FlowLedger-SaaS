import { Popover, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger } from '../ui/popover'

interface Props {
    trigger: React.ReactNode;
    title?: string;
    description?: string;
    content?: React.ReactNode
    popoverClass?: string
}

const ReusablePopover = ({ trigger, title, description, content, popoverClass }: Props) => (    <Popover>
      <PopoverTrigger render={<div />}>
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
    </Popover>)

export default ReusablePopover