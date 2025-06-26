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
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  restaurantId: string;
  category?: string;
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  cartTotal: number;
  userRole: 'customer' | 'restaurant_owner' | 'rider' | 'admin';
  addToCart: (item: MenuItem, quantity?: number) => void;
  setCartItemQuantity: (item: MenuItem & { addOns?: Array<{id: string, name: string, price: number}> }, totalQuantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// ฟังก์ชันตรวจสอบ ID format (รองรับทั้ง UUID และ CUID)
const isValidId = (str: string): boolean => {
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // CUID format (Prisma default)
  const cuidRegex = /^c[a-z0-9]{24}$/i;
  
  return uuidRegex.test(str) || cuidRegex.test(str);
};

// Interface สำหรับข้อมูลที่ดึงจาก API
interface ApiRestaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  status: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  categories: ApiCategory[];
}

interface ApiCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  menuItems: ApiMenuItem[];
}

interface ApiMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  calories?: number;
  isVegetarian: boolean;
  isSpicy: boolean;
}

// ฟังก์ชันแปลงข้อมูลจาก API เป็น Restaurant interface
const transformApiToRestaurant = (apiData: ApiRestaurant): Restaurant => {
  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description || '',
    logo: apiData.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    banner: apiData.imageUrl || 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=400&fit=crop',
    theme: {
      primaryColor: '#e53e3e',
      secondaryColor: '#fc8181',
    },
    contact: {
      phone: apiData.phone || '',
      address: apiData.address || '',
      hours: apiData.openTime && apiData.closeTime 
        ? `${apiData.openTime} - ${apiData.closeTime}` 
        : '08:00 - 22:00',
    },
    menu: apiData.categories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(category => ({
        id: category.id,
        name: category.name,
        items: category.menuItems
          .filter(item => item.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            originalPrice: undefined,
            image: item.imageUrl || 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=200&fit=crop',
            category: category.id,
            available: item.isAvailable,
            cookingTime: 15,
            isRecommended: false,
            tags: [
              ...(item.isSpicy ? ['เผ็ด'] : []),
              ...(item.isVegetarian ? ['มังสวิรัติ'] : [])
            ]
          }))
      }))
  };
};

// ฟังก์ชันจัดการ localStorage แยกตามร้าน
const getCartStorageKey = (restaurantId: string, userRole: string) => 
  `redpotion_cart_${userRole}_${restaurantId}`;

const saveCartToStorage = (restaurantId: string, cart: CartItem[], userRole: string) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      // ตรวจสอบว่า cart เป็น array ก่อนบันทึก
      if (Array.isArray(cart)) {
        const key = getCartStorageKey(restaurantId, userRole);
        console.log('💾 saveCartToStorage:', { key, cartLength: cart.length, cart });
        localStorage.setItem(key, JSON.stringify(cart));
        console.log('✅ บันทึกสำเร็จ');
      } else {
        console.warn('⚠️ Cart ไม่ใช่ array:', cart);
      }
    } catch (error) {
      console.warn('❌ ไม่สามารถบันทึกตะกร้าได้:', error);
    }
  }
};

const loadCartFromStorage = (restaurantId: string, userRole: string): CartItem[] => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const key = getCartStorageKey(restaurantId, userRole);
      const saved = localStorage.getItem(key);
      console.log('📂 loadCartFromStorage:', { key, saved });
      
      if (saved) {
        const parsedCart = JSON.parse(saved);
        console.log('📋 ParsedCart:', parsedCart);
        // ตรวจสอบว่าข้อมูลที่โหลดมาเป็น array ที่ถูกต้อง
        if (Array.isArray(parsedCart)) {
          console.log('✅ โหลดตะกร้าสำเร็จ:', parsedCart.length, 'รายการ');
          return parsedCart;
        } else {
          console.warn('⚠️ ข้อมูลใน localStorage ไม่ใช่ array');
        }
      } else {
        console.log('📋 ไม่มีข้อมูลตะกร้าใน localStorage');
      }
    } catch (error) {
      console.warn('❌ ไม่สามารถโหลดตะกร้าได้:', error);
      // ลบข้อมูลที่เสียหายออก
      try {
        localStorage.removeItem(getCartStorageKey(restaurantId, userRole));
      } catch (e) {
        console.warn('ไม่สามารถลบข้อมูลที่เสียหายได้:', e);
      }
    }
  }
  console.log('📋 ส่งกลับตะกร้าว่าง');
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

  // โหลดตะกร้าจาก localStorage เมื่อเปลี่ยนร้าน (หลัง hydration เท่านั้น)
  useEffect(() => {
    if (!mounted || !restaurant) return;
    
    // รอให้ hydration เสร็จก่อนโหลด localStorage
    const timer = setTimeout(() => {
      const savedCart = loadCartFromStorage(restaurant.id, userRole);
      console.log('📂 โหลดตะกร้าจาก localStorage:', {
        restaurantId: restaurant.id,
        savedItems: savedCart.length,
        savedCart: savedCart
      });
      setCart(savedCart);
    }, 100);

    return () => clearTimeout(timer);
  }, [restaurant?.id, mounted, userRole]);

  // บันทึกตะกร้าลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (!mounted || !restaurant) return;
    
    console.log('💾 บันทึกตะกร้าลง localStorage:', {
      restaurantId: restaurant.id,
      cartItems: cart.length,
      cart: cart
    });
    saveCartToStorage(restaurant.id, cart, userRole);
  }, [cart, restaurant?.id, mounted, userRole]);

  useEffect(() => {
    if (!mounted) return;

    const loadRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ตรวจสอบรูปแบบ ID ก่อน
        if (!isValidId(restaurantId)) {
          throw new Error(`รูปแบบ Restaurant ID ไม่ถูกต้อง: ${restaurantId}. กรุณาใช้ CUID หรือ UUID`);
        }

        // เรียก API เพื่อดึงข้อมูลร้านจาก database
        try {
          const response = await fetch(`/api/restaurant/${restaurantId}`);
          if (response.ok) {
            const apiData = await response.json();
            
            // ใช้ function transformApiToRestaurant เพื่อแปลงข้อมูล
            const restaurant = transformApiToRestaurant(apiData);
            setRestaurant(restaurant);
            return;
          } else if (response.status === 404) {
            throw new Error(`ไม่พบร้านอาหารที่มี ID: ${restaurantId}`);
          } else {
            throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูลร้าน: ${response.status}`);
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          throw new Error(
            apiError instanceof Error 
              ? apiError.message 
              : 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        console.error('🚨 RestaurantProvider Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantId, mounted]);

  // คำนวณยอดรวมตะกร้า (รวม add-ons)
  const cartTotal = cart.reduce((total, item) => {
    const basePrice = item.price * item.quantity;
    const addOnsPrice = item.addOns ? item.addOns.reduce((addOnTotal, addOn) => addOnTotal + addOn.price, 0) * item.quantity : 0;
    return total + basePrice + addOnsPrice;
  }, 0);

  // เพิ่มสินค้าในตะกร้า (ใช้สำหรับปุ่มเพิ่มในเมนู - เพิ่มทีละ 1)
  const addToCart = (item: MenuItem, quantity: number = 1) => {
    if (!restaurant) return;

    setCart(prevCart => {
      // ใช้ item.id เป็น unique identifier สำหรับสินค้า + add-ons
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.itemId === item.id);
      
      if (existingItemIndex >= 0) {
        // สินค้ามีอยู่แล้ว - เพิ่มจำนวน
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        // สินค้าใหม่
        const newCartItem: CartItem = {
          itemId: item.id, // ใช้ unique ID ที่ส่งมา (อาจมี add-ons)
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          quantity,
          restaurantId: restaurant.id,
          category: item.category
        };
        return [...prevCart, newCartItem];
      }
    });
  };

  // ตั้งจำนวนสินค้าในตะกร้า (ใช้สำหรับหน้า item - ตั้งค่าจำนวนรวม)
  const setCartItemQuantity = (item: MenuItem & { addOns?: Array<{id: string, name: string, price: number}> }, totalQuantity: number) => {
    if (!restaurant) {
      console.log('❌ setCartItemQuantity: ไม่มีข้อมูลร้าน');
      return;
    }

    console.log('🛒 setCartItemQuantity:', {
      itemId: item.id,
      itemName: item.name,
      quantity: totalQuantity,
      restaurantId: restaurant.id,
      addOns: item.addOns
    });

    setCart(prevCart => {
      console.log('📋 Cart ก่อนเพิ่ม:', prevCart);
      
      // ใช้ item.id เป็น unique identifier สำหรับสินค้า + add-ons
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.itemId === item.id);
      
      if (existingItemIndex >= 0) {
        // สินค้ามีอยู่แล้ว - ตั้งค่าจำนวนรวม
        console.log('♻️ อัปเดตสินค้าเดิม');
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity = totalQuantity;
        console.log('📋 Cart หลังอัปเดต:', updatedCart);
        return updatedCart;
      } else {
        // สินค้าใหม่
        console.log('➕ เพิ่มสินค้าใหม่');
        const newCartItem: CartItem = {
          itemId: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          quantity: totalQuantity,
          restaurantId: restaurant.id,
          category: item.category,
          addOns: item.addOns // เพิ่ม add-ons
        };
        const newCart = [...prevCart, newCartItem];
        console.log('📋 Cart หลังเพิ่มใหม่:', newCart);
        return newCart;
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
      setCartItemQuantity,
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
  return isValidId(restaurantId);
};

export const getAvailableRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const response = await fetch('/api/restaurant');
    if (response.ok) {
      const restaurants = await response.json();
      return restaurants.map(transformApiToRestaurant);
    }
    return [];
  } catch (error) {
    console.error('ไม่สามารถดึงรายการร้านได้:', error);
    return [];
  }
}; 