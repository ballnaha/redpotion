import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const restaurantId = searchParams.get('restaurantId') || 'cmcg20f2i00029hu8p2am75df';
  
  // ตรวจสอบ User Agent เพื่อดูว่าเป็น LINE App หรือไม่
  const userAgent = request.headers.get('user-agent') || '';
  const isLineApp = userAgent.includes('Line');
  
  console.log('LIFF Redirect API:', {
    userAgent,
    isLineApp,
    restaurantId,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  // Redirect ไปยังหน้าเมนูพร้อม LIFF flag
  const targetUrl = new URL(`/menu/${restaurantId}`, request.url);
  targetUrl.searchParams.set('liff', 'true');
  
  if (isLineApp) {
    targetUrl.searchParams.set('auto_login', 'true');
  }

  return NextResponse.redirect(targetUrl);
}