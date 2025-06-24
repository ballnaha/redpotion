'use client';

import { use } from 'react';
import Link from 'next/link';

export default function RestaurantOwnerPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);

  return (
    <div>
      <h2>📊 Dashboard Overview</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>📋 จัดการเมนู</h3>
          <p>เพิ่ม แก้ไข ลบรายการอาหาร</p>
          <Link href={`/restaurant/${restaurantId}/menu`}>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              จัดการเมนู
            </button>
          </Link>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>📦 ออเดอร์</h3>
          <p>ดูและจัดการออเดอร์ลูกค้า</p>
          <Link href={`/restaurant/${restaurantId}/orders`}>
            <button style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              ดูออเดอร์
            </button>
          </Link>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>📈 รายงาน</h3>
          <p>ดูสถิติและยอดขาย</p>
          <Link href={`/restaurant/${restaurantId}/analytics`}>
            <button style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              ดูรายงาน
            </button>
          </Link>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>⚙️ ตั้งค่า</h3>
          <p>ข้อมูลร้านและการตั้งค่า</p>
          <Link href={`/restaurant/${restaurantId}/settings`}>
            <button style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              ตั้งค่า
            </button>
          </Link>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #f59e0b'
      }}>
        <h3>🚧 กำลังพัฒนา</h3>
        <p>ระบบ Restaurant Owner Dashboard กำลังอยู่ในระหว่างการพัฒนา</p>
        <p>Restaurant ID: <code>{restaurantId}</code></p>
        
        <div style={{ marginTop: '1rem' }}>
          <Link href={`/menu/${restaurantId}`}>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}>
              📱 ดูหน้าลูกค้า
            </button>
          </Link>
          
          <Link href="/">
            <button style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🏠 กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 