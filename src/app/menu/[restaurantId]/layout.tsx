'use client';

import { use, useState, useEffect } from 'react';
import { ThemeRegistry } from '../../components/ThemeRegistry';
import { RestaurantProvider } from './context/RestaurantContext';
import ErrorBoundary from '../../components/ErrorBoundary';

function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

// Layout สำหรับหน้าเมนูลูกค้า
export default function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);

  return (
    <ThemeRegistry>
      <ErrorBoundary>
        <RestaurantProvider restaurantId={restaurantId} userRole="customer">
          <CustomerLayoutContent>
            {children}
          </CustomerLayoutContent>
        </RestaurantProvider>
      </ErrorBoundary>
    </ThemeRegistry>
  );
} 