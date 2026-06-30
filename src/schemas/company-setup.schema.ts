import z from "zod";

export const companySetupSchema = z.object({
    companyPin: z
        .string()
        .min(3, 'Company ID must be at least 3 characters')
        .max(15, 'Company ID must not exceed 15 characters')
        .regex(
            /^[a-z0-9-]+$/,
            'Only lowercase letters, numbers, and dashes are allowed'
        ),
    companyName: z
        .string()
        .min(2, 'Company name must be at least 2 characters')
        .max(100, 'Company name must not exceed 100 characters'),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must not exceed 50 characters'),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must not exceed 50 characters'),
});

export type CompanySetupForm = z.infer<typeof companySetupSchema>;