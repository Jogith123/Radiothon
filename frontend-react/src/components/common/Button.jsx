/**
 * Reusable Button Component
 * 
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost)
 * - Size options (sm, md, lg)
 * - Framer Motion hover/tap animations
 * - Loading state support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { buttonHover, buttonTap, transitions } from '../../lib/motion';

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
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-lg shadow-primary/30',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/50',
        outline: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-slate-300',
        ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 shadow-lg shadow-red-500/30',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
        <motion.button
            whileHover={disabled ? undefined : buttonHover}
            whileTap={disabled ? undefined : buttonTap}
            transition={transitions.fast}
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
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
