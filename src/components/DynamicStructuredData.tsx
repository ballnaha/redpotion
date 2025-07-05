'use client';

import { useEffect, useState } from 'react';
import { getDefaultRestaurant, DefaultRestaurant } from '../lib/defaultRestaurant';

export default function DynamicStructuredData() {
  const [restaurant, setRestaurant] = useState<DefaultRestaurant | null>(null);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const defaultRestaurant = await getDefaultRestaurant();
        setRestaurant(defaultRestaurant);
      } catch (error) {
        console.error('Error loading restaurant for structured data:', error);
      }
    };

    loadRestaurant();
  }, []);

  if (!restaurant) {
    return null;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const restaurantName = restaurant.restaurantName;

  // Restaurant Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurantName,
    "url": baseUrl,
    "logo": `${baseUrl}/images/default_restaurant1.jpg`,
    "description": `ร้านอาหาร ${restaurantName} - สั่งอาหารออนไลน์ รสชาติอร่อย จัดส่งรวดเร็ว`,
    "foundingDate": "2024",
    "servesCuisine": "Thai",
    "priceRange": "$$",
    "acceptsReservations": true,
    "hasMenu": `${baseUrl}/menu/${restaurant.restaurantId}`,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "TH",
      "availableLanguage": ["Thai"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TH",
      "addressLocality": "Bangkok"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "paymentAccepted": ["Cash", "Credit Card"],
    "currenciesAccepted": "THB"
  };

  // Food Establishment Schema
  const foodEstablishmentSchema = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": restaurantName,
    "url": baseUrl,
    "description": `สั่งอาหารออนไลน์จาก ${restaurantName} ระบบสั่งอาหารที่ทันสมัย รวดเร็ว และปลอดภัย`,
    "servesCuisine": ["Thai", "Asian"],
    "hasMenu": `${baseUrl}/menu/${restaurant.restaurantId}`,
    "priceRange": "$$",
    "acceptsReservations": false,
    "takeaway": true,
    "delivery": true,
    "diningMode": ["Takeaway", "Delivery"],
    "paymentAccepted": ["Cash", "Credit Card", "Mobile Payment"],
    "currenciesAccepted": "THB"
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": `${restaurantName} - สั่งอาหารออนไลน์`,
    "url": baseUrl,
    "description": `เว็บไซต์สั่งอาหารออนไลน์ ${restaurantName}`,
    "inLanguage": "th",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/menu/${restaurant.restaurantId}?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      {/* Restaurant Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      
      {/* Food Establishment Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(foodEstablishmentSchema)
        }}
      />
      
      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
    </>
  );
} 