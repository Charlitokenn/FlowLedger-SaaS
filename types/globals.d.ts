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

interface Contract {
    id: string;
    plotId: string;
    clientContactId: string;
    status: string;
    startDate: string;
    termMonths: number;
    totalContractValue: string;
    purchasePlan: string;
    downpaymentPercent: number | null;
    downpaymentAmount: string;
    financedAmount: string;
    cancellationFeePercent: string;
    graceDays: number;
    delinquentDaysThreshold: number;
    delinquentSince: string | null;
    cancelledAt: string | null;
    cancelledBy: string | null;
    cancellationFeeAmount: string | null;
    refundedAmount: string | null;
    cancellationReason: string | null;
    createdAt: string;
    updatedAt: string;
    installments: any[]; // Define more specifically if you have installment structure
    payments: any[]; // Define more specifically if you have payment structure
    events: any[]; // Define more specifically if you have event structure
}

interface Project {
    projectName: string;
}

interface Plot {
    id: string;
    plotNumber: string;
    unsurveyedSize: string;
    surveyedSize: string;
    surveyedPlotNumber: string | null;
    project: Project;
    activeContract: Contract | null;
    contracts: Contract[];
}

interface ClientContact {
    id: string;
    fullName: string;
    mobileNumber: string;
    altMobileNumber: string | null;
    email: string | null;
    gender: string | null;
    contactType: string | null;
    idType: string | null;
    idNumber: string | null;
    region: string | null;
    district: string | null;
    ward: string | null;
    street: string | null;
    firstNOKName: string | null;
    firstNOKMobile: string | null;
    firstNOKRelationship: string | null;
    secondNOKName: string | null;
    secondNOKMobile: string | null;
    secondNOKRelationship: string | null;
    clientPhoto: string | null;
    addedBy: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    plots: Plot[];
}

type ClientContacts = ClientContact[];