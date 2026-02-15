/**
 * Button Component — solid, stable, no glow
 */

import React from 'react';
import { clsx } from 'clsx';

const Button = React.memo(({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    className,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1E293B]/40';

    const variants = {
        primary: 'bg-[#1E293B] text-white hover:bg-[#334155]',
        secondary: 'bg-[#F0F2F5] text-[#111827] hover:bg-[#E5E7EB]',
        outline: 'border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F6F7F9]',
        ghost: 'text-[#4B5563] hover:bg-[#F0F2F5]',
        danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B]',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
        <button
            disabled={disabled || loading}
            className={clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                (disabled || loading) && 'opacity-50 cursor-not-allowed',
                className
            )}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : Icon ? (
                <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
            ) : null}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
