import type { ReactNode } from 'react';

export interface ContainerProps {
    children: ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses: Record<NonNullable<ContainerProps['size']>, string> = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full',
};

export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
    return (
        <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
            {children}
        </div>
    );
}
