export const formatThousand = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
};

export const parseThousand = (value: string | null | undefined): number | null => {
    if (!value) return null;
    let cleanValue = value.replace(/\./g, ''); // Remove thousand separators (dots)
    cleanValue = cleanValue.replace(/,/g, '.'); // Replace decimal comma with dot
    if (cleanValue === '') return null;
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
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
