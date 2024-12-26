import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatCurrency(amount) {
    if (amount === null || amount === undefined) {
        return '0 so\'m';
    }

    try {
        const formatter = new Intl.NumberFormat('uz-UZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return `${formatter.format(amount)} so'm`;
    } catch (error) {
        console.error('Error formatting currency:', error);
        return '0 so\'m';
    }
}
