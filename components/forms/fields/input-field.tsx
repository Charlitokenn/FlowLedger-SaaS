import { cn } from "@/lib/utils"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"

type FormInputProps = {
  name: string
  label: string
  placeholder?: string
  type?: string
  disabled?: boolean
  value?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (name: any, options?: any) => any
  error?: { message?: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation?: any
}

const InputField = ({name,label, placeholder, type = 'text', register, error, validation, disabled, value}: FormInputProps) => {
  return (
    <div className="space-y-2">
        <Label htmlFor="name" className="form-label">{label}</Label>
        <Input 
            type={type}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            className={cn('form-input',{'opacity-50 cursor-not-allowed': disabled})}
            {...register(name,validation)}
        />
        {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default InputField