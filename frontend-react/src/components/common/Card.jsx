/**
 * Card Component — flat white surface with subtle border
 */

import React from 'react';
import { clsx } from 'clsx';

const Card = React.memo(({
    children,
    className,
    padding = 'default',
    ...props
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={clsx(
                'bg-white rounded-[10px] border border-[#E5E7EB]',
                paddingStyles[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
