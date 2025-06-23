'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  contact: {
    phone: string;
    address: string;
    hours: string;
  };
  menu: MenuCategory[];
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  available: boolean;
  cookingTime: number;
  isRecommended?: boolean;
  tags?: string[];
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Mock data สำหรับร้านอาหารต่างๆ
const mockRestaurants: Record<string, Restaurant> = {
  restaurant1: {
    id: 'restaurant1',
    name: 'ข้าวแกงใต้แท้',
    description: 'อาหารใต้แท้รสจัดจ้าน ครบครันทุกเมนู',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=400&fit=crop',
    theme: {
      primaryColor: '#e53e3e',
      secondaryColor: '#fc8181',
    },
    contact: {
      phone: '02-123-4567',
      address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
      hours: '08:00 - 22:00',
    },
    menu: [
      {
        id: 'southern',
        name: 'อาหารใต้',
        items: [
          {
            id: 'gaeng-som',
            name: 'แกงส้มปลาช่อน',
            description: 'แกงส้มรสเปรื้อย ปลาช่อนสดใหม่',
            price: 89,
            originalPrice: 120,
            image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=200&fit=crop',
            category: 'southern',
            available: true,
            cookingTime: 15,
            isRecommended: true,
            tags: ['เผ็ด', 'เปรื้อย']
          },
          {
            id: 'gaeng-tai-pla',
            name: 'แกงไตปลา',
            description: 'แกงไตปลารสจัดจ้าน เผ็ดร้อนแท้ใต้',
            price: 95,
            originalPrice: 130,
            image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
            category: 'southern',
            available: true,
            cookingTime: 18,
            tags: ['เผ็ดมาก', 'แท้ใต้']
          }
        ]
      }
    ]
  },
  restaurant2: {
    id: 'restaurant2',
    name: 'ซูชิ โตเกียว',
    description: 'ซูชิสไตล์ญี่ปุ่นแท้ วัตถุดิบนำเข้าจากญี่ปุ่น',
    logo: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
    theme: {
      primaryColor: '#2d3748',
      secondaryColor: '#4a5568',
    },
    contact: {
      phone: '02-234-5678',
      address: '456 ถนนสีลม กรุงเทพฯ 10500',
      hours: '11:00 - 23:00',
    },
    menu: [
      {
        id: 'sushi',
        name: 'ซูชิ',
        items: [
          {
            id: 'salmon-sushi',
            name: 'ซูชิแซลมอน',
            description: 'แซลมอนนอร์เวย์สดใหม่ ข้าวญี่ปุ่นแท้',
            price: 149,
            originalPrice: 180,
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop',
            category: 'sushi',
            available: true,
            cookingTime: 5,
            isRecommended: true,
            tags: ['สด', 'พรีเมี่ยม']
          },
          {
            id: 'tuna-sushi',
            name: 'ซูชิทูน่า',
            description: 'ทูน่าชั้นดี เนื้อแน่น รสชาติเข้มข้น',
            price: 169,
            originalPrice: 200,
            image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&h=200&fit=crop',
            category: 'sushi',
            available: true,
            cookingTime: 5,
            tags: ['พรีเมี่ยม', 'เนื้อแน่น']
          }
        ]
      }
    ]
  },
  restaurant3: {
    id: 'restaurant3',
    name: 'เจ๊หนู ส้มตำ',
    description: 'ส้มตำอีสาน รสชาติต้นตำรับ เผ็ดจี๊ดจ๊าด',
    logo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop',
    theme: {
      primaryColor: '#38a169',
      secondaryColor: '#68d391',
    },
    contact: {
      phone: '02-345-6789',
      address: '789 ถนนรามคำแหง กรุงเทพฯ 10240',
      hours: '10:00 - 21:00',
    },
    menu: [
      {
        id: 'isaan',
        name: 'อาหารอีสาน',
        items: [
          {
            id: 'som-tam',
            name: 'ส้มตำไทย',
            description: 'ส้มตำรสชาติต้นตำรับ เผ็ดกำลังดี',
            price: 59,
            originalPrice: 80,
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
            category: 'isaan',
            available: true,
            cookingTime: 10,
            isRecommended: true,
            tags: ['เผ็ด', 'อีสาน']
          },
          {
            id: 'larb-moo',
            name: 'ลาบหมู',
            description: 'ลาบหมูสับละเอียด เครื่องเทศครบ',
            price: 79,
            originalPrice: 100,
            image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop',
            category: 'isaan',
            available: true,
            cookingTime: 12,
            tags: ['เผ็ด', 'หอม']
          }
        ]
      }
    ]
  }
};

export function RestaurantProvider({ 
  children, 
  restaurantId 
}: { 
  children: ReactNode; 
  restaurantId: string;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call - only on client side
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const restaurantData = mockRestaurants[restaurantId];
        
        if (!restaurantData) {
          throw new Error(`ไม่พบร้านอาหาร: ${restaurantId}`);
        }
        
        setRestaurant(restaurantData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantId, mounted]);

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    if (!restaurant) return;
    
    setRestaurant(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        menu: prev.menu.map(category => ({
          ...category,
          items: category.items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        }))
      };
    });
  };

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      loading,
      error,
      updateMenuItem
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
} 