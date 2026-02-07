/**
 * Formats a number with thousand separators (dots).
 * @param value The number to format
 * @returns Formatted string
 */
export const formatThousand = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';

    // Convert to string and remove non-digit characters except for potentially a comma for decimal
    const str = value.toString().replace(/[^0-9]/g, '');
    if (str === '') return '';

    return new Intl.NumberFormat('id-ID').format(parseInt(str, 10));
};

/**
 * Parses a formatted string with thousand separators back to a number.
 * @param value The formatted string
 * @returns The parsed number
 */
export const parseThousand = (value: string | null | undefined): number | null => {
    if (!value) return null;

    // Remove all non-digit characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === '') return null;

    return parseInt(cleanValue, 10);
};

/**
 * Currency formatter for display
 */
export const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);
};
