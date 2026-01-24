/**
 * Reusable Card Component
 * 
 * Features:
 * - Glassmorphism styling
 * - Optional hover animations
 * - Multiple padding options
 */

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { cardVariants, cardHover, transitions } from '../../lib/motion';

const Card = React.memo(({
    children,
    className,
    padding = 'default',
    hover = false,
    animate = true,
    as: Component = 'div',
    ...props
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
    };

    const MotionComponent = animate ? motion[Component] || motion.div : Component;

    const motionProps = animate ? {
        variants: cardVariants,
        initial: 'hidden',
        animate: 'visible',
        whileHover: hover ? cardHover : undefined,
        transition: transitions.default,
    } : {};

    return (
        <MotionComponent
            className={clsx(
                'glass rounded-2xl',
                paddingStyles[padding],
                hover && 'cursor-pointer',
                className
            )}
            {...motionProps}
            {...props}
        >
            {children}
        </MotionComponent>
    );
});

Card.displayName = 'Card';

export default Card;
