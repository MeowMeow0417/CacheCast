'use client'

import React from 'react';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex items-center justify-center min-h-screen w-full bg-background">
      {children}
    </main>
  );
};

export default DashboardLayout;
