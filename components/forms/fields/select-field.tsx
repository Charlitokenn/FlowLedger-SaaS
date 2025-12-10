import {Label} from "@/components/ui/label";
import {Controller} from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type SelectOption = {
    value: string;
    label: string;
}

type SelectFieldProps = {
    name: string;
    label: string;
    placeholder?: string;
    options: SelectOption[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: any;
    error?: { message?: string };
    required?: boolean;
}

const SelectField = ({ name, label, placeholder, options, control, error, required = false }: SelectFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="select-trigger">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
                            {options.map((option: SelectOption) => (
                                <SelectItem value={option.value} key={option.value} className="focus:bg-accent focus:text-accent-foreground">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        {error && <p className="text-sm text-destructive">{error.message}</p>}
                    </Select>
                )}
            />
        </div>
    )
}
export default SelectField