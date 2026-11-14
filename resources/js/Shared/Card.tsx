import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ children, padding = 'md', className = '', ...props }: CardProps) {
    return (
        <div
            className={`rounded-xl border border-stone-200/80 bg-white ${paddingClasses[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
