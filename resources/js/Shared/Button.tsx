import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-cta text-cta-text hover:bg-cta-hover focus:ring-highlight/30',
    secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 focus:ring-stone-400',
    accent: 'bg-brand text-white hover:bg-brand-hover focus:ring-brand/30',
    outline:
        'border border-stone-300 text-stone-800 bg-white hover:bg-page hover:border-brand focus:ring-brand/20',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-sm rounded-lg',
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            type="button"
            disabled={disabled || isLoading}
            className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : null}
            {children}
        </button>
    );
}
