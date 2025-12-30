/**
 * TransitionWrapper - Smooth Page Transitions
 * Provides fade and slide animations between routes using Framer Motion
 * Matches the premium gold/leather aesthetic
 */

import React from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface TransitionWrapperProps {
  children: React.ReactNode;
}

/**
 * Animation variants for page transitions
 * Smooth fade with subtle slide for premium feel
 */
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10, // Subtle slide down
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut", // Using named easing for safety
    },
  },
  exit: {
    opacity: 0,
    y: -10, // Subtle slide up on exit
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
