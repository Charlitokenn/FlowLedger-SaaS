export { }

declare global {
    interface SessionClaims {
        azp: string;
        exp: number;
        firstName: string;
        fva: number[];
        iat: number;
        iss: string;
        jti: string;
        nbf: number;
        o: {
            id: string;
            rol: string;
            slg: string;
        };
        orgLogo: string;
        orgName: string;
        sid: string;
        sts: string;
        sub: string;
        v: number;
    }

    interface TabItem {
        value: string
        label: string
        icon: LucideIcon
        content: ReactNode
    }

    interface HorizontalTabsProps {
        tabs: TabItem[]
        defaultValue?: string
        className?: string
    }

    interface VerticalTabsProps {
        tabs: TabItem[]
        defaultValue?: string
        className?: string
        contentClassName?: string
    }

    interface FormInputProps {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    interface Option {
        value: string;
        label: string;
    };

    interface SelectFieldProps {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };
}