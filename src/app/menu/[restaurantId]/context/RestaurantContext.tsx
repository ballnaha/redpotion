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
  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description || '',
    logo: apiData.imageUrl || '/images/favicon.png',
    banner: apiData.imageUrl || '/images/default_restaurant1.jpg',
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
      try {
        setLoading(true);
        setError(null);
        
        // ตรวจสอบรูปแบบ ID ก่อน
        if (!isValidId(restaurantId)) {
          console.warn('🚨 รูปแบบ Restaurant ID ไม่ถูกต้อง:', restaurantId);
          
          // แสดงข้อความแจ้งเตือนสั้นๆ ก่อน redirect
          if (typeof window !== 'undefined') {
            // สร้าง toast notification แบบง่าย
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(239, 68, 68, 0.95);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: inherit;
              font-size: 14px;
              z-index: 10000;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(10px);
              animation: slideInDown 0.3s ease-out;
            `;
            notification.textContent = 'ลิงก์ไม่ถูกต้อง กำลังนำคุณกลับไปหน้าหลัก...';
            
            // เพิ่ม CSS animation
            const style = document.createElement('style');
            style.textContent = `
              @keyframes slideInDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
              }
            `;
            document.head.appendChild(style);
            document.body.appendChild(notification);
            
            // ลบ notification หลัง 2 วินาที
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
              if (style.parentNode) {
                style.remove();
              }
            }, 2000);
          }
          
          // Redirect หลังจาก delay เล็กน้อย
          setTimeout(() => {
            router.replace('/');
          }, 1500);
          return;
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
            console.warn('🚨 ไม่พบร้านอาหารที่มี ID:', restaurantId);
            
            // แสดงข้อความแจ้งเตือนก่อน redirect
            if (typeof window !== 'undefined') {
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(251, 191, 36, 0.95);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                animation: slideInDown 0.3s ease-out;
              `;
              notification.textContent = 'ไม่พบร้านอาหารที่ต้องการ กำลังนำคุณกลับไปหน้าหลัก...';
              
              document.body.appendChild(notification);
              
              // ลบ notification หลัง 2 วินาที
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 2000);
            }
            
            // Redirect หลังจาก delay เล็กน้อย
            setTimeout(() => {
              router.replace('/');
            }, 1500);
            return;
          } else if (response.status === 202) {
            // ร้านมีสถานะ PENDING
            const errorData = await response.json();
            console.log('🟡 ร้านอาหารรอการอนุมัติ:', errorData);
            
            // แสดงข้อความแจ้งเตือนสำหรับ PENDING status
            if (typeof window !== 'undefined') {
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(33, 150, 243, 0.95);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                animation: slideInDown 0.3s ease-out;
                text-align: center;
                max-width: 350px;
                line-height: 1.4;
              `;
              notification.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">🎉 ${errorData.restaurantName || 'ร้านอาหาร'}</div>
                <div style="font-size: 13px;">กำลังรอการอนุมัติจาก admin</div>
              `;
              
              document.body.appendChild(notification);
              
              // ลบ notification หลัง 4 วินาที
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 4000);
            }
            
            // Redirect หลังจาก delay เล็กน้อย
            setTimeout(() => {
              router.replace('/');
            }, 3000);
            return;
          } else if (response.status === 403) {
            // ร้านมีสถานะอื่นๆ (REJECTED, SUSPENDED, CLOSED)
            const errorData = await response.json();
            console.log('🔴 ร้านอาหารไม่สามารถเข้าถึงได้:', errorData);
            
            // แสดงข้อความแจ้งเตือนตามสถานะ
            if (typeof window !== 'undefined') {
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(239, 68, 68, 0.95);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                animation: slideInDown 0.3s ease-out;
                text-align: center;
                max-width: 350px;
                line-height: 1.4;
              `;
              notification.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px;">⚠️ ${errorData.restaurantName || 'ร้านอาหาร'}</div>
                <div style="font-size: 13px;">${errorData.message}</div>
              `;
              
              document.body.appendChild(notification);
              
              // ลบ notification หลัง 4 วินาที
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 4000);
            }
            
            // Redirect หลังจาก delay เล็กน้อย
            setTimeout(() => {
              router.replace('/');
            }, 3000);
            return;
          } else {
            throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูลร้าน: ${response.status}`);
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          // หากเป็น network error หรือ error อื่นๆ ที่ไม่ใช่ 404
          if (apiError instanceof TypeError && apiError.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
          } else {
            throw new Error(
              apiError instanceof Error 
                ? apiError.message 
                : 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้'
            );
          }
        }
      } catch (err) {
        // จัดการ error อื่นๆ ที่ไม่ใช่ 404 หรือ invalid ID
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        console.error('🚨 RestaurantProvider Error:', err);
      } finally {
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