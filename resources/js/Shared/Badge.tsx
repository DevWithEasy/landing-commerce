import type { ReactNode } from 'react';

export interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    success: 'bg-emerald-50 text-heading ring-1 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    info: 'bg-stone-100 text-heading ring-1 ring-stone-300/60',
    neutral: 'bg-stone-100 text-stone-700 ring-1 ring-stone-300/60',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
};

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </span>
    );
}
