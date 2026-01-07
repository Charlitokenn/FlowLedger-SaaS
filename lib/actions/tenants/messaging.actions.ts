'use server';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.NEXT_SMS_BASE_URL;
const USERNAME = process.env.NEXT_SMS_USERNAME;
const PASSWORD = process.env.NEXT_SMS_PASSWORD;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Status {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
}

interface ErrorInfo {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
    permanent: boolean;
}

interface MessageResponse {
    to: string;
    status: Status;
    smsCount: number;
}

interface SMSResponse {
    messages: MessageResponse[];
}

interface DeliveryReport {
    messageId: string;
    sentAt: string;
    doneAt: string;
    to: string;
    smsCount: number;
    status: Status | null;
    error: ErrorInfo | null;
}

interface DeliveryReportsResponse {
    results: DeliveryReport[];
}

interface SMSLog {
    messageId: string;
    sentAt: string;
    doneAt: string;
    to: string;
    from: string;
    text: string;
    smsCount: number;
    status: Status;
    error: ErrorInfo | null;
}

interface SMSLogsResponse {
    results: SMSLog[];
}

interface BalanceResponse {
    sms_balance: number;
}

interface SubCustomerResponse {
    success: boolean;
    status: number;
    message: string;
    result: any;
}

type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateCredentials(): void {
    if (!USERNAME || !PASSWORD) {
        throw new Error(
            'SMS credentials not configured. Please set NEXT_SMS_USERNAME and NEXT_SMS_PASSWORD environment variables.'
        );
    }
}

function createAuthHeader(): string {
    validateCredentials();
    const credentials = `${USERNAME}:${PASSWORD}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

function buildUrl(path: string): string {
    return `${BASE_URL}${path}`;
}

async function handleApiRequest<T>(
    url: string,
    options: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': createAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data: T = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

function validatePhoneNumber(phone: string): boolean {
    // Tanzanian phone numbers should start with 255 and be 12 digits
    return /^255\d{9}$/.test(phone);
}

function validatePhoneNumbers(phones: string | string[]): void {
    const phoneArray = Array.isArray(phones) ? phones : [phones];
    const invalidPhones = phoneArray.filter(phone => !validatePhoneNumber(phone));

    if (invalidPhones.length > 0) {
        throw new Error(
            `Invalid phone number(s): ${invalidPhones.join(', ')}. Phone numbers must be in format 255XXXXXXXXX`
        );
    }
}

// ============================================================================
// SMS SENDING ACTIONS
// ============================================================================

/**
 * Send SMS to a single destination
 */
export async function sendSingleSMS(
    from: string,
    to: string,
    text: string,
    reference?: string
): Promise<ApiResponse<SMSResponse>> {
    try {
        validatePhoneNumbers(to);

        if (!text || text.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/text/single'),
            {
                method: 'POST',
                body: JSON.stringify({
                    from,
                    to,
                    text,
                    ...(reference && { reference }),
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send SMS to multiple destinations (single message)
 */
export async function sendSingleSMSToMultiple(
    from: string,
    to: string[],
    text: string,
    reference?: string
): Promise<ApiResponse<SMSResponse>> {
    try {
        if (!Array.isArray(to) || to.length === 0) {
            throw new Error('Recipients array cannot be empty');
        }

        validatePhoneNumbers(to);

        if (!text || text.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/text/single'),
            {
                method: 'POST',
                body: JSON.stringify({
                    from,
                    to,
                    text,
                    ...(reference && { reference }),
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send multiple messages to multiple destinations
 */
export async function sendMultipleSMS(
    messages: Array<{
        from: string;
        to: string | string[];
        text: string;
    }>,
    reference?: string
): Promise<ApiResponse<SMSResponse>> {
    try {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Messages array cannot be empty');
        }

        // Validate all phone numbers and texts
        for (const msg of messages) {
            validatePhoneNumbers(msg.to);
            if (!msg.text || msg.text.trim().length === 0) {
                throw new Error('All messages must have non-empty text');
            }
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/text/multi'),
            {
                method: 'POST',
                body: JSON.stringify({
                    messages,
                    ...(reference && { reference }),
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Schedule SMS for later delivery
 */
export async function scheduleSMS(
    from: string,
    to: string,
    text: string,
    date: string,
    time: string,
    options?: {
        repeat?: 'hourly' | 'daily' | 'weekly' | 'monthly';
        start_date?: string;
        end_date?: string;
    }
): Promise<ApiResponse<SMSResponse>> {
    try {
        validatePhoneNumbers(to);

        if (!text || text.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Date must be in format YYYY-MM-DD');
        }

        // Validate time format (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(time)) {
            throw new Error('Time must be in format HH:MM (24-hour)');
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/text/single'),
            {
                method: 'POST',
                body: JSON.stringify({
                    from,
                    to,
                    text,
                    date,
                    time,
                    ...options,
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send SMS via GET link (simple method)
 */
export async function sendSMSViaLink(
    from: string,
    to: string,
    text: string
): Promise<ApiResponse<{ message: string }>> {
    try {
        validateCredentials();
        validatePhoneNumbers(to);

        if (!text || text.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        const params = new URLSearchParams({
            username: USERNAME!,
            password: PASSWORD!,
            from,
            to,
            text,
        });

        const response = await fetch(
            buildUrl(`/link/sms/v1/text/single?${params.toString()}`),
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return { success: true, data: { message: 'SMS sent successfully' } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// ============================================================================
// TEST MODE ACTIONS
// ============================================================================

/**
 * Test single SMS (no charges, dummy data)
 */
export async function testSingleSMS(
    from: string,
    to: string,
    text: string,
    reference?: string
): Promise<ApiResponse<SMSResponse>> {
    try {
        validatePhoneNumbers(to);

        if (!text || text.trim().length === 0) {
            throw new Error('Message text cannot be empty');
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/test/text/single'),
            {
                method: 'POST',
                body: JSON.stringify({
                    from,
                    to,
                    text,
                    ...(reference && { reference }),
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Test multiple SMS (no charges, dummy data)
 */
export async function testMultipleSMS(
    messages: Array<{
        from: string;
        to: string | string[];
        text: string;
    }>,
    reference?: string
): Promise<ApiResponse<SMSResponse>> {
    try {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Messages array cannot be empty');
        }

        // Validate all phone numbers and texts
        for (const msg of messages) {
            validatePhoneNumbers(msg.to);
            if (!msg.text || msg.text.trim().length === 0) {
                throw new Error('All messages must have non-empty text');
            }
        }

        return await handleApiRequest<SMSResponse>(
            buildUrl('/api/sms/v1/test/text/multi'),
            {
                method: 'POST',
                body: JSON.stringify({
                    messages,
                    ...(reference && { reference }),
                }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// ============================================================================
// DELIVERY REPORTS ACTIONS
// ============================================================================

/**
 * Get all delivery reports
 */
export async function getDeliveryReports(
    params?: {
        size?: number;
        sender?: string;
        messageId?: string;
        sentSince?: string;
        sentUntil?: string;
        reference?: string;
    }
): Promise<ApiResponse<DeliveryReportsResponse>> {
    try {
        const queryParams = new URLSearchParams();

        if (params?.size) {
            if (params.size > 500) {
                throw new Error('Size parameter cannot exceed 500');
            }
            queryParams.append('size', params.size.toString());
        }
        if (params?.sender) queryParams.append('sender', params.sender);
        if (params?.messageId) queryParams.append('messageId', params.messageId);
        if (params?.sentSince) queryParams.append('sentSince', params.sentSince);
        if (params?.sentUntil) queryParams.append('sentUntil', params.sentUntil);
        if (params?.reference) queryParams.append('reference', params.reference);

        const url = buildUrl(`/api/sms/v1/reports${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`);

        return await handleApiRequest<DeliveryReportsResponse>(url, {
            method: 'GET',
        });
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get delivery report by message ID
 */
export async function getDeliveryReportByMessageId(
    messageId: string
): Promise<ApiResponse<DeliveryReportsResponse>> {
    try {
        if (!messageId || messageId.trim().length === 0) {
            throw new Error('Message ID cannot be empty');
        }

        return await handleApiRequest<DeliveryReportsResponse>(
            buildUrl(`/api/sms/v1/reports?messageId=${messageId}`),
            { method: 'GET' }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get delivery reports by date range
 */
export async function getDeliveryReportsByDateRange(
    sentSince: string,
    sentUntil: string
): Promise<ApiResponse<DeliveryReportsResponse>> {
    try {
        if (!sentSince || !sentUntil) {
            throw new Error('Both sentSince and sentUntil dates are required');
        }

        return await handleApiRequest<DeliveryReportsResponse>(
            buildUrl(`/api/sms/v1/reports?sentSince=${sentSince}&sentUntil=${sentUntil}`),
            { method: 'GET' }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// ============================================================================
// SMS LOGS ACTIONS
// ============================================================================

/**
 * Get all sent SMS logs
 */
export async function getSMSLogs(
    params?: {
        from?: string;
        to?: string;
        sentSince?: string;
        sentUntil?: string;
        offset?: number;
        limit?: number;
        reference?: string;
    }
): Promise<ApiResponse<SMSLogsResponse>> {
    try {
        const queryParams = new URLSearchParams();

        if (params?.from) queryParams.append('from', params.from);
        if (params?.to) {
            validatePhoneNumbers(params.to);
            queryParams.append('to', params.to);
        }
        if (params?.sentSince) queryParams.append('sentSince', params.sentSince);
        if (params?.sentUntil) queryParams.append('sentUntil', params.sentUntil);
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        if (params?.limit) {
            if (params.limit > 500) {
                throw new Error('Limit parameter cannot exceed 500');
            }
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.reference) queryParams.append('reference', params.reference);

        const url = buildUrl(`/api/sms/v1/logs${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`);

        return await handleApiRequest<SMSLogsResponse>(url, { method: 'GET' });
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get SMS logs with filters
 */
export async function getSMSLogsFiltered(
    from: string,
    to: string,
    sentSince: string,
    sentUntil: string
): Promise<ApiResponse<SMSLogsResponse>> {
    try {
        validatePhoneNumbers(to);

        if (!from || !sentSince || !sentUntil) {
            throw new Error('All filter parameters are required');
        }

        return await handleApiRequest<SMSLogsResponse>(
            buildUrl(`/api/sms/v1/logs?from=${from}&to=${to}&sentSince=${sentSince}&sentUntil=${sentUntil}`),
            { method: 'GET' }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// ============================================================================
// BALANCE ACTION
// ============================================================================

/**
 * Get SMS account balance
 */
export async function getSMSBalance(): Promise<ApiResponse<BalanceResponse>> {
    return await handleApiRequest<BalanceResponse>(
        buildUrl('/api/sms/v1/balance'),
        { method: 'GET' }
    );
}

// ============================================================================
// SUB CUSTOMER MANAGEMENT (RESELLER APIs)
// ============================================================================

/**
 * Register a new sub customer
 */
export async function registerSubCustomer(
    customerData: {
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        phone_number: string;
        account_type: 'Sub Customer' | 'Sub Customer (Reseller)';
        sms_price: number;
    }
): Promise<ApiResponse<SubCustomerResponse>> {
    try {
        // Validate required fields
        const requiredFields = ['first_name', 'last_name', 'username', 'email', 'phone_number', 'account_type', 'sms_price'];
        for (const field of requiredFields) {
            if (!customerData[field as keyof typeof customerData]) {
                throw new Error(`${field} is required`);
            }
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
            throw new Error('Invalid email format');
        }

        // Validate SMS price
        if (customerData.sms_price <= 0) {
            throw new Error('SMS price must be greater than 0');
        }

        return await handleApiRequest<SubCustomerResponse>(
            buildUrl('/api/reseller/v1/sub_customer/create'),
            {
                method: 'POST',
                body: JSON.stringify(customerData),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Recharge a sub customer's SMS balance
 */
export async function rechargeSubCustomer(
    email: string,
    smscount: number
): Promise<ApiResponse<SubCustomerResponse>> {
    try {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Valid email is required');
        }

        if (!smscount || smscount <= 0) {
            throw new Error('SMS count must be greater than 0');
        }

        return await handleApiRequest<SubCustomerResponse>(
            buildUrl('/api/reseller/v1/sub_customer/recharge'),
            {
                method: 'POST',
                body: JSON.stringify({ email, smscount }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Deduct SMS balance from a sub customer
 */
export async function deductSubCustomer(
    email: string,
    smscount: number
): Promise<ApiResponse<SubCustomerResponse>> {
    try {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Valid email is required');
        }

        if (!smscount || smscount <= 0) {
            throw new Error('SMS count must be greater than 0');
        }

        return await handleApiRequest<SubCustomerResponse>(
            buildUrl('/api/reseller/v1/sub_customer/deduct'),
            {
                method: 'POST',
                body: JSON.stringify({ email, smscount }),
            }
        );
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}