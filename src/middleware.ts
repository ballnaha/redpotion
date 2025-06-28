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
                                  req.nextUrl.pathname.startsWith('/restaurant/gallery')
    const isAdmin = req.nextUrl.pathname.startsWith('/admin')

    // If user is on auth page and already authenticated, redirect appropriately
    // แต่ให้ตรวจสอบว่าไม่ใช่การ refresh หรือ initial load
    if (isAuthPage && isAuth && !req.nextUrl.searchParams.has('callbackUrl')) {
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
    '/admin/:path*',
    '/auth/:path*',
    '/api/restaurant/:path*'
  ]
} 