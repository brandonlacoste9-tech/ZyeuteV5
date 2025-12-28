/**
 * PageTransition - Wraps individual page components with smooth transitions
 * Use this to wrap route elements for animated page transitions
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
    },
  },
};

// Main tabs should switch instantly without animation
const TAB_ROUTES = ['/', '/feed', '/explore', '/notifications', '/upload'];

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if current route is a main tab or profile page
  const isTab = TAB_ROUTES.some(r => location.pathname === r) || location.pathname.startsWith('/profile');

  // If it's a main tab, render immediately without transition
  // This prevents layout jumps and makes navigation feel "native"
  if (isTab) {
    return <div className="w-full h-full">{children}</div>;
  }

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

