'use client';

import ClientMenuPage from './ClientMenuPage';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CustomerMenuPage(props: any) {
  const params = useParams();

  useEffect(() => {
    console.log('🍽️ Menu page loaded for restaurant:', params.restaurantId);
    console.log('🔍 Current URL params:', window.location.search);
    
    if (window.location.search.includes('liff=true')) {
      console.log('✅ LIFF flag detected in menu page');
    }
  }, [params.restaurantId]);

  return <ClientMenuPage {...props} />;
} 