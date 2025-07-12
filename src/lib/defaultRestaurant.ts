export interface DefaultRestaurant {
  restaurantId: string;
  restaurantName: string;
  status: string;
  liffId?: string;
  liffUrl?: string;
}

/**
 * Get default restaurant from API
 */
// Fallback default restaurant เมื่อไม่สามารถ fetch ได้
const FALLBACK_DEFAULT_RESTAURANT: DefaultRestaurant = {
  restaurantId: 'cmczw9ayn00029hk83pdo9bwz', // Default restaurant ID
  restaurantName: 'Red Potion Restaurant',
  status: 'ACTIVE'
};

export async function getDefaultRestaurant(): Promise<DefaultRestaurant | null> {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/restaurant/default`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // ใช้ fallback เมื่อไม่สามารถ fetch ได้
    if (process.env.NODE_ENV !== 'development') {
      return FALLBACK_DEFAULT_RESTAURANT;
    }
    
    console.error('Failed to fetch default restaurant:', response.status, '- using fallback');
    return FALLBACK_DEFAULT_RESTAURANT;
  } catch (error) {
    // ใช้ fallback เมื่อเกิด error
    if (process.env.NODE_ENV !== 'development') {
      return FALLBACK_DEFAULT_RESTAURANT;
    }
    
    console.error('Error fetching default restaurant:', error, '- using fallback');
    return FALLBACK_DEFAULT_RESTAURANT;
  }
}

/**
 * Get default restaurant menu URL
 */
export async function getDefaultMenuUrl(liffFlag = false): Promise<string> {
  const defaultRestaurant = await getDefaultRestaurant();
  
  if (!defaultRestaurant) {
    return '/'; // fallback to home
  }
  
  const menuUrl = `/menu/${defaultRestaurant.restaurantId}`;
  return liffFlag ? `${menuUrl}?liff=true` : menuUrl;
}

/**
 * Get default restaurant LIFF URL
 */
export async function getDefaultLiffUrl(): Promise<string | null> {
  const defaultRestaurant = await getDefaultRestaurant();
  
  if (!defaultRestaurant?.liffId) {
    return null;
  }
  
  return `https://liff.line.me/${defaultRestaurant.liffId}?restaurant=${defaultRestaurant.restaurantId}`;
}

/**
 * Client-side hook for getting default restaurant
 */
export function useDefaultRestaurant() {
  const [defaultRestaurant, setDefaultRestaurant] = React.useState<DefaultRestaurant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getDefaultRestaurant()
      .then(setDefaultRestaurant)
      .catch(err => {
        console.error('Error in useDefaultRestaurant:', err);
        setError('Failed to load default restaurant');
      })
      .finally(() => setLoading(false));
  }, []);

  return { defaultRestaurant, loading, error };
}

import React from 'react'; 