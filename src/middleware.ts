import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ฟังก์ชันตรวจสอบ UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Legacy mapping สำหรับ compatibility
const legacyMapping: Record<string, string> = {
  'restaurant1': '550e8400-e29b-41d4-a716-446655440001',
  'restaurant2': '550e8400-e29b-41d4-a716-446655440002',
  'restaurant3': '550e8400-e29b-41d4-a716-446655440003',
  'r1': '550e8400-e29b-41d4-a716-446655440001',
  'r2': '550e8400-e29b-41d4-a716-446655440002',
  'r3': '550e8400-e29b-41d4-a716-446655440003'
};

// Restaurant whitelist (ในการผลิตจริงควรเก็บใน database)
const validRestaurants = new Set([
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
]);

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  
  console.log('🛡️ Middleware - Processing:', pathname);

  // Role-based route definitions
  const roleBasedRoutes = {
    '/menu/': 'customer',
    '/restaurant/': 'restaurant_owner', 
    '/rider/': 'rider',
    '/admin/': 'admin'
  };

  // ตรวจสอบ role-based routing
  for (const [routePrefix, requiredRole] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      console.log(`🎯 ${requiredRole.toUpperCase()} route detected:`, pathname);
      
      // สำหรับ /menu/[restaurantId] และ /restaurant/[restaurantId]
      if (routePrefix === '/menu/' || routePrefix === '/restaurant/') {
        const restaurantMatch = pathname.match(new RegExp(`^${routePrefix.replace('/', '\\/')}([^\/]+)(?:\/.*)?$`));
        
        if (restaurantMatch) {
          const restaurantId = restaurantMatch[1];
          console.log('🏪 Restaurant ID found:', restaurantId);
          
          let resolvedId = restaurantId;
          
          // ตรวจสอบ legacy mapping
          if (legacyMapping[restaurantId]) {
            resolvedId = legacyMapping[restaurantId];
            
            // Redirect legacy ID ไป UUID
            const newUrl = new URL(request.url);
            newUrl.pathname = pathname.replace(restaurantId, resolvedId);
            
            console.log(`🔄 Redirecting legacy ID ${restaurantId} to ${resolvedId}`);
            return NextResponse.redirect(newUrl, 301);
          }
          
          // ตรวจสอบ UUID format
          if (!isValidUUID(resolvedId)) {
            console.error(`❌ Invalid restaurant ID format: ${restaurantId}`);
            return new NextResponse(
              JSON.stringify({ 
                error: 'รูปแบบ Restaurant ID ไม่ถูกต้อง',
                code: 'INVALID_RESTAURANT_ID',
                restaurantId 
              }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          // ตรวจสอบว่าร้านอาหารมีอยู่จริง
          if (!validRestaurants.has(resolvedId)) {
            console.error(`❌ Restaurant not found: ${resolvedId}`);
            return new NextResponse(
              JSON.stringify({ 
                error: 'ไม่พบร้านอาหารนี้ในระบบ',
                code: 'RESTAURANT_NOT_FOUND',
                restaurantId: resolvedId 
              }),
              { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          console.log(`✅ Valid ${requiredRole} access to restaurant:`, resolvedId);
        }
      }
      
      // TODO: เพิ่ม authentication check ตาม role
      // const userRole = getUserRole(request); // จาก JWT token หรือ session
      // if (userRole !== requiredRole) {
      //   return NextResponse.redirect('/login');
      // }
      
      break;
    }
  }

  // Legacy redirects
  // Redirect /r/[restaurantId] to /menu/[restaurantId] (สำหรับลูกค้า)
  if (pathname.startsWith('/r/')) {
    const pathParts = pathname.split('/');
    const restaurantId = pathParts[2];
    
    if (restaurantId) {
      console.log('🔄 Redirecting legacy /r/ path to /menu/:', restaurantId);
      
      const newUrl = new URL(request.url);
      const remainingPath = pathParts.slice(3).join('/');
      newUrl.pathname = `/menu/${restaurantId}${remainingPath ? '/' + remainingPath : ''}`;
      
      return NextResponse.redirect(newUrl, 301);
    }
  }

  // Legacy restaurant-site redirect to restaurant owner dashboard
  if (pathname.startsWith('/restaurant-site/')) {
    const pathParts = pathname.split('/');
    const restaurantId = pathParts[2];
    
    if (restaurantId) {
      console.log('🔄 Redirecting legacy /restaurant-site/ to /restaurant/:', restaurantId);
      
      const newUrl = new URL(request.url);
      const remainingPath = pathParts.slice(3).join('/');
      newUrl.pathname = `/restaurant/${restaurantId}${remainingPath ? '/' + remainingPath : ''}`;
      
      return NextResponse.redirect(newUrl, 301);
    }
  }
  
  // จัดการ subdomain routing
  if (hostname.includes('localhost') || hostname.includes('theredpotion.com')) {
    // ตรวจสอบ subdomain patterns
    const restaurantMatch = hostname.match(/^restaurant(\d+)\./);
    const shortcodeMatch = hostname.match(/^r(\d+)\./);
    
    if (restaurantMatch || shortcodeMatch) {
      const subdomain = restaurantMatch ? `restaurant${restaurantMatch[1]}` : `r${shortcodeMatch![1]}`;
      
      if (legacyMapping[subdomain]) {
        const targetUUID = legacyMapping[subdomain];
        
        // สร้าง URL ใหม่ที่ redirect ไป UUID path
        const newUrl = new URL(request.url);
        newUrl.hostname = newUrl.hostname.replace(/^(restaurant\d+|r\d+)\./, '');
        newUrl.pathname = `/restaurant-site/${targetUUID}${pathname === '/' ? '' : pathname}`;
        
        console.log(`🔄 Subdomain redirect: ${subdomain} -> ${targetUUID}`);
        return NextResponse.rewrite(newUrl);
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Role-based routes
    '/menu/:path*',
    '/restaurant/:path*',
    '/rider/:path*',
    '/admin/:path*',
    // Legacy routes for redirects
    '/restaurant-site/:path*',
    '/r/:path*',
    // รวม root path สำหรับ subdomain handling
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 