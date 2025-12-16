/**
 * Landing Page - Public-facing home page for non-authenticated users
 * Houses the Hero component with CTA buttons
 */

import React from 'react';
import { Hero } from '@/components/Hero';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
    </div>
  );
};

export default Landing;
