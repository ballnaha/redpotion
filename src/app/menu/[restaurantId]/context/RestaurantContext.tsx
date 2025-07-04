'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  imageUrl?: string;
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
  imageUrl?: string;
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
  categories?: ApiCategory[];
}

interface ApiCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  menuItems?: ApiMenuItem[];
}

interface ApiMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  calories?: number;
  tags?: string[];
}

// ฟังก์ชันแปลงข้อมูลจาก API เป็น Restaurant interface
const transformApiToRestaurant = (apiData: ApiRestaurant): Restaurant => {
  console.log('🔄 Transforming API data to Restaurant:', {
    id: apiData.id,
    name: apiData.name,
    imageUrl: apiData.imageUrl,
    hasImageUrl: !!apiData.imageUrl
  });

  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description || '',
    logo: apiData.imageUrl || '/images/favicon.png',
    banner: apiData.imageUrl || '/images/default_restaurant1.jpg',
    imageUrl: apiData.imageUrl,
    theme: {
      primaryColor: '#e53e3e',
      secondaryColor: '#fc8181',
    },
    contact: {
      phone: apiData.phone || '',
      address: apiData.address || '',
      hours: apiData.openTime && apiData.closeTime 
        ? `${apiData.openTime} - ${apiData.closeTime}` 
        : '-',
    },
    menu: (() => {
      // สร้าง categories ปกติ
      const regularCategories = (apiData.categories || [])
        .filter(cat => cat.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(category => ({
          id: category.id,
          name: category.name,
          imageUrl: category.imageUrl,
          items: (category.menuItems || [])
            .filter(item => item.isAvailable)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price,
              originalPrice: item.originalPrice,
              image: item.imageUrl || '',
              category: category.id,
              available: item.isAvailable,
              cookingTime: 15,
              isRecommended: item.tags?.includes('recommended') || false,
              tags: item.tags || []
            }))
        }));

      // รวบรวมเมนูทั้งหมด
      const allMenuItems = regularCategories.flatMap(cat => cat.items);

      // สร้าง virtual categories สำหรับ tags
      const virtualCategories: MenuCategory[] = [];

      // เมนูแนะนำ
      const recommendedItems = allMenuItems.filter(item => item.tags.includes('recommended'));
      if (recommendedItems.length > 0) {
        virtualCategories.push({
          id: 'virtual-recommended',
          name: 'เมนูแนะนำ',
          imageUrl: undefined,
          items: recommendedItems
        });
      }

      // เมนูขายดี
      const bestsellerItems = allMenuItems.filter(item => item.tags.includes('bestseller'));
      if (bestsellerItems.length > 0) {
        virtualCategories.push({
          id: 'virtual-bestseller',
          name: 'สินค้าขายดี',
          imageUrl: undefined,
          items: bestsellerItems
        });
      }

      // เมนูใหม่
      const newItems = allMenuItems.filter(item => item.tags.includes('new'));
      if (newItems.length > 0) {
        virtualCategories.push({
          id: 'virtual-new',
          name: 'เมนูใหม่',
          imageUrl: undefined,
          items: newItems
        });
      }

      // รวม virtual categories กับ regular categories
      return [...virtualCategories, ...regularCategories];
    })()
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
  const router = useRouter();
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

    const savedCart = loadCartFromStorage(restaurant.id, userRole);
    console.log('🔄 Loading cart from storage:', savedCart);
    setCart(savedCart);
  }, [restaurant?.id, userRole, mounted]);

  // บันทึกตะกร้าใน localStorage เมื่อมีการเปลี่ยนแปลง (หลัง hydration เท่านั้น)
  useEffect(() => {
    if (!mounted || !restaurant) return;
    
    console.log('💾 Saving cart to storage:', cart);
    saveCartToStorage(restaurant.id, cart, userRole);
  }, [cart, restaurant?.id, userRole, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const loadRestaurant = async () => {
      if (!isValidId(restaurantId)) {
        console.error('❌ Invalid restaurant ID format:', restaurantId);
        setError('รหัสร้านอาหารไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading restaurant data for ID:', restaurantId);
        const response = await fetch(`/api/restaurant/${restaurantId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API response not ok:', response.status, errorData);
          setError(errorData.message || `Error: ${response.status}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('✅ Raw API response:', data);
        console.log('🖼️ API imageUrl:', data.imageUrl);
        
        if (!data || !data.id) {
          console.error('❌ Invalid restaurant data:', data);
          setError('ข้อมูลร้านอาหารไม่ถูกต้อง');
          setLoading(false);
          return;
        }

        const transformedData = transformApiToRestaurant(data);
        console.log('✅ Transformed restaurant data:', transformedData);
        console.log('🖼️ Final banner URL:', transformedData.banner);
        
        setRestaurant(transformedData);
        setLoading(false);
      } catch (err) {
        // จัดการ error อื่นๆ ที่ไม่ใช่ 404 หรือ invalid ID
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        console.error('🚨 RestaurantProvider Error:', err);
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantId, mounted, router]);

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