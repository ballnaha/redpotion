'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  cartTotal: number;
  userRole: 'customer' | 'restaurant_owner' | 'rider' | 'admin';
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// ฟังก์ชันตรวจสอบ UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Mock data สำหรับร้านอาหารต่างๆ ใช้ UUID
const mockRestaurants: Record<string, Restaurant> = {
  // ร้านข้าวแกงใต้แท้
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
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
  // ร้านซูชิ โตเกียว
  '550e8400-e29b-41d4-a716-446655440002': {
    id: '550e8400-e29b-41d4-a716-446655440002',
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
  // ร้านเจ๊หนู ส้มตำ
  '550e8400-e29b-41d4-a716-446655440003': {
    id: '550e8400-e29b-41d4-a716-446655440003',
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

// Mapping เก่าไปใหม่สำหรับ backward compatibility
const legacyMapping: Record<string, string> = {
  'restaurant1': '550e8400-e29b-41d4-a716-446655440001',
  'restaurant2': '550e8400-e29b-41d4-a716-446655440002',
  'restaurant3': '550e8400-e29b-41d4-a716-446655440003',
  'r1': '550e8400-e29b-41d4-a716-446655440001',
  'r2': '550e8400-e29b-41d4-a716-446655440002',
  'r3': '550e8400-e29b-41d4-a716-446655440003'
};

// ฟังก์ชันจัดการ localStorage แยกตามร้าน
const getCartStorageKey = (restaurantId: string, userRole: string) => 
  `redpotion_cart_${userRole}_${restaurantId}`;

const saveCartToStorage = (restaurantId: string, cart: CartItem[], userRole: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getCartStorageKey(restaurantId, userRole), JSON.stringify(cart));
    } catch (error) {
      console.warn('ไม่สามารถบันทึกตะกร้าได้:', error);
    }
  }
};

const loadCartFromStorage = (restaurantId: string, userRole: string): CartItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(getCartStorageKey(restaurantId, userRole));
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('ไม่สามารถโหลดตะกร้าได้:', error);
      return [];
    }
  }
  return [];
};

export function RestaurantProvider({ 
  children, 
  restaurantId,
  userRole = 'customer'
}: { 
  children: ReactNode; 
  restaurantId: string;
  userRole?: 'customer' | 'restaurant_owner' | 'rider' | 'admin';
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // โหลดตะกร้าจาก localStorage เมื่อเปลี่ยนร้าน
  useEffect(() => {
    if (!mounted || !restaurant) return;
    
    const savedCart = loadCartFromStorage(restaurant.id, userRole);
    setCart(savedCart);
  }, [restaurant?.id, mounted, userRole]);

  // บันทึกตะกร้าลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (!mounted || !restaurant) return;
    
    saveCartToStorage(restaurant.id, cart, userRole);
  }, [cart, restaurant?.id, mounted, userRole]);

  useEffect(() => {
    if (!mounted) return;

    const loadRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let resolvedRestaurantId = restaurantId;

        // ตรวจสอบ UUID format
        if (!isValidUUID(restaurantId)) {
          if (legacyMapping[restaurantId]) {
            console.warn(`⚠️ ใช้ legacy restaurant ID: ${restaurantId}. กรุณาเปลี่ยนเป็น UUID: ${legacyMapping[restaurantId]}`);
            resolvedRestaurantId = legacyMapping[restaurantId];
          } else {
            throw new Error(`รูปแบบ Restaurant ID ไม่ถูกต้อง: ${restaurantId}. กรุณาใช้ UUID format`);
          }
        }
        
        const restaurantData = mockRestaurants[resolvedRestaurantId];
        
        if (!restaurantData) {
          throw new Error(`ไม่พบร้านอาหาร: ${resolvedRestaurantId}`);
        }
        
        setRestaurant(restaurantData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        console.error('🚨 RestaurantProvider Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantId, mounted]);

  // คำนวณยอดรวมตะกร้า
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // เพิ่มสินค้าในตะกร้า
  const addToCart = (item: MenuItem, quantity: number = 1) => {
    if (!restaurant) return;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.itemId === item.id);
      
      if (existingItemIndex >= 0) {
        // สินค้ามีอยู่แล้ว ให้เพิ่มจำนวน
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        // สินค้าใหม่
        const newCartItem: CartItem = {
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          restaurantId: restaurant.id
        };
        return [...prevCart, newCartItem];
      }
    });
  };

  // ลบสินค้าจากตะกร้า
  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.itemId !== itemId));
  };

  // อัปเดตจำนวนสินค้าในตะกร้า
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.itemId === itemId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  // ล้างตะกร้า
  const clearCart = () => {
    setCart([]);
  };

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      loading,
      error,
      cart,
      cartTotal,
      userRole,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart
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

// Helper functions
export const generateRestaurantId = (): string => {
  return uuidv4();
};

export const validateRestaurantAccess = (restaurantId: string, userRole?: string): boolean => {
  if (!isValidUUID(restaurantId) && !legacyMapping[restaurantId]) {
    return false;
  }
  return true;
};

export const getAvailableRestaurants = (): Restaurant[] => {
  return Object.values(mockRestaurants);
}; 