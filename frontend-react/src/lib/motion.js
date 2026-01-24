/**
 * Centralized Framer Motion Animation Presets
 * 
 * This file contains all animation variants and transitions used across
 * the VidyaVani dashboard for consistent, performant animations.
 * 
 * Performance notes:
 * - Only animate opacity and transform (translate/scale) for GPU acceleration
 * - Respects prefers-reduced-motion for accessibility
 */

// ============================================
// Transition Presets
// ============================================

export const transitions = {
    fast: { duration: 0.15, ease: 'easeOut' },
    default: { duration: 0.25, ease: 'easeOut' },
    smooth: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    spring: { type: 'spring', stiffness: 300, damping: 25 },
    springBouncy: { type: 'spring', stiffness: 400, damping: 20 },
};

// ============================================
// Page & Container Variants
// ============================================

export const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
};

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// ============================================
// Card & Item Variants
// ============================================

export const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: transitions.default,
    },
};

export const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: transitions.default,
    },
};

export const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: transitions.default,
    },
};

// ============================================
// Interactive Element Variants
// ============================================

export const buttonHover = {
    scale: 1.02,
    y: -2,
};

export const buttonTap = {
    scale: 0.98,
};

export const cardHover = {
    y: -4,
    scale: 1.01,
    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
};

// ============================================
// Pipeline/Stage Variants
// ============================================

export const stageVariants = {
    idle: {
        scale: 1,
        opacity: 0.6,
    },
    active: {
        scale: 1.05,
        opacity: 1,
        transition: transitions.spring,
    },
    complete: {
        scale: 1,
        opacity: 1,
    },
};

export const pulseVariants = {
    pulse: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// ============================================
// Modal & Overlay Variants
// ============================================

export const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: transitions.smooth,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: transitions.fast,
    },
};

// ============================================
// Stagger Configurations
// ============================================

export const staggerChildren = {
    fast: { staggerChildren: 0.05 },
    default: { staggerChildren: 0.08 },
    slow: { staggerChildren: 0.12 },
};

// ============================================
// Reduced Motion Support
// ============================================

/**
 * Returns simplified variants for users who prefer reduced motion
 * @param {Object} variants - Original animation variants
 * @returns {Object} - Simplified variants with instant transitions
 */
export const getReducedMotionVariants = (variants) => {
    const reducedVariants = {};
    for (const key in variants) {
        reducedVariants[key] = {
            ...variants[key],
            transition: { duration: 0 },
        };
    }
    return reducedVariants;
};

/**
 * Hook-compatible motion props that respect reduced motion
 * Use: <motion.div {...getMotionProps(cardVariants)}>
 */
export const getMotionProps = (variants, isReducedMotion = false) => {
    const activeVariants = isReducedMotion
        ? getReducedMotionVariants(variants)
        : variants;

    return {
        variants: activeVariants,
        initial: 'hidden',
        animate: 'visible',
        exit: 'exit',
    };
};

// ============================================
// Common Animation Configurations
// ============================================

export const defaultPageAnimation = {
    variants: pageVariants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    transition: transitions.default,
};

export const defaultContainerAnimation = {
    variants: containerVariants,
    initial: 'hidden',
    animate: 'visible',
};
