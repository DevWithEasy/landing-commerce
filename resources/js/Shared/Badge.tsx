import type { ReactNode } from 'react';

export interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10',
    neutral: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/10',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-md font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </span>
    );
}
