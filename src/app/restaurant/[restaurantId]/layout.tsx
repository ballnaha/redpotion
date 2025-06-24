'use client';

import { use } from 'react';
import { ThemeRegistry } from '../../components/ThemeRegistry';

// Layout สำหรับ Restaurant Owner
export default function RestaurantOwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);

  return (
    <ThemeRegistry>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h1>🏪 Restaurant Owner Dashboard</h1>
          <p>Restaurant ID: {restaurantId}</p>
        </div>
        {children}
      </div>
    </ThemeRegistry>
  );
} 