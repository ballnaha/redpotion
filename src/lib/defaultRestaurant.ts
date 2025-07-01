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
export async function getDefaultRestaurant(): Promise<DefaultRestaurant | null> {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
    const response = await fetch(`${baseUrl}/api/restaurant/default`);
    
    if (response.ok) {
      return await response.json();
    }
    
    console.error('Failed to fetch default restaurant:', response.status);
    return null;
  } catch (error) {
    console.error('Error fetching default restaurant:', error);
    return null;
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