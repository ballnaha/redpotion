import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    // เฉพาะ /restaurant (management) ไม่ใช่ /restaurant/[restaurantId] (public page)
    const isRestaurantManagement = req.nextUrl.pathname === '/restaurant' || 
                                  req.nextUrl.pathname.startsWith('/restaurant/settings') ||
                                  req.nextUrl.pathname.startsWith('/restaurant/menu') ||
                                  req.nextUrl.pathname.startsWith('/restaurant/gallery') ||
                                  req.nextUrl.pathname.startsWith('/restaurant/liff-setup')
    const isAdmin = req.nextUrl.pathname.startsWith('/admin')

    // Handle LIFF routing - detect LINE browser and redirect to specific restaurant
    const userAgent = req.headers.get('user-agent') || ''
    const isLineApp = userAgent.includes('Line') || 
                     req.nextUrl.searchParams.has('liff') ||
                     req.nextUrl.searchParams.get('openExternalBrowser') === '1'
    
    // ถ้าเป็น LINE app และเข้า root path ให้ redirect ไป LIFF page
    // แต่ไม่ redirect ถ้าอยู่ในหน้าเมนูแล้ว เพื่อป้องกัน loop
    if (isLineApp && req.nextUrl.pathname === '/' && !req.nextUrl.pathname.includes('/menu/')) {
      // Redirect ไป LIFF page เพื่อหา default restaurant จาก API
      const url = new URL('/liff', req.url)
      console.log('Middleware redirecting LIFF to LIFF page:', url.toString())
      return NextResponse.redirect(url)
    }

    // ป้องกัน redirect loop - ถ้าอยู่ในหน้าเมนูแล้วและมี liff flag ให้ผ่าน
    if (req.nextUrl.pathname.includes('/menu/') && req.nextUrl.searchParams.has('liff')) {
      console.log('Already in menu with LIFF flag, allowing through')
      return NextResponse.next()
    }

    // If user is on auth page and already authenticated, redirect appropriately
    // แต่ไม่ redirect ถ้ามี callbackUrl หรือเป็น signin/error pages เพื่อป้องกัน loop
    // หรือถ้าเป็น register page ให้ผ่านไปได้ปกติ
    if (isAuthPage && isAuth && 
        !req.nextUrl.searchParams.has('callbackUrl') &&
        !req.nextUrl.pathname.includes('/signin') &&
        !req.nextUrl.pathname.includes('/error') &&
        !req.nextUrl.pathname.includes('/register')) {
      if (token.role === 'RESTAURANT_OWNER') {
        return NextResponse.redirect(new URL('/restaurant', req.url))
      } else if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Protect dashboard routes (legacy - will be deprecated)
    if (isDashboard) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      
      if (token.role !== 'RESTAURANT_OWNER') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Protect restaurant management routes
    if (isRestaurantManagement) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      
      if (token.role !== 'RESTAURANT_OWNER') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Protect admin routes
    if (isAdmin) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always allow access to auth pages and API routes
        if (req.nextUrl.pathname.startsWith('/auth') || 
            req.nextUrl.pathname.startsWith('/api')) {
          return true
        }

        // Allow public pages
        if (req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/menu') ||
            req.nextUrl.pathname.startsWith('/restaurant/') || // เฉพาะ public restaurant pages
            req.nextUrl.pathname.startsWith('/profile') ||
            req.nextUrl.pathname.startsWith('/cart')) {
          return true
        }

        // Require auth for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/restaurant',
    '/restaurant/settings/:path*',
    '/restaurant/menu/:path*',
    '/restaurant/gallery/:path*',
    '/restaurant/liff-setup/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/api/restaurant/:path*'
  ]
} 