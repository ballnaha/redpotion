import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          console.log('🔐 NextAuth credential login attempt:', credentials.email)

          // ค้นหา user ในฐานข้อมูล
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { restaurant: true }
          })

          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }

          // ตรวจสอบว่ามี password (ไม่ใช่ LINE user)
          if (!user.password) {
            console.log('❌ User has no password (LINE user):', credentials.email)
            return null
          }

          // ตรวจสอบ password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', credentials.email)
            return null
          }

          // ตรวจสอบ role (เฉพาะ RESTAURANT_OWNER และ ADMIN)
          if (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN') {
            console.log('❌ Invalid role for NextAuth:', user.role)
            return null
          }

          console.log('✅ NextAuth login successful:', {
            email: user.email,
            role: user.role,
            restaurantId: user.restaurant?.id
          })

          return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            image: user.image || undefined,
            role: user.role,
            restaurantId: user.restaurant?.id || undefined
          }

        } catch (error) {
          console.error('❌ NextAuth authorize error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.restaurantId = (user as any).restaurantId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).restaurantId = token.restaurantId
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback:', { url, baseUrl })
      
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)
        
        // Log สำหรับ debug
        console.log('🔍 URL analysis:', {
          urlHostname: urlObj.hostname,
          baseHostname: baseUrlObj.hostname,
          urlPathname: urlObj.pathname,
          urlSearch: urlObj.search
        })
        
        // ถ้า URL เป็น same origin ใช้ได้เลย
        if (urlObj.origin === baseUrlObj.origin) {
          console.log('✅ Same origin URL:', url)
          return url
        }
        
        // ถ้า URL เป็น production URL แต่เรากำลังอยู่ใน development
        if (urlObj.hostname === 'red.theredpotion.com' && baseUrlObj.hostname === 'localhost') {
          const localUrl = `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`
          console.log('🔄 Converting production URL to local:', localUrl)
          return localUrl
        }
        
        // ถ้า URL เป็น development URL แต่เรากำลังอยู่ใน production
        if (urlObj.hostname === 'localhost' && baseUrlObj.hostname === 'red.theredpotion.com') {
          const prodUrl = `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`
          console.log('🔄 Converting local URL to production:', prodUrl)
          return prodUrl
        }
        
        // ถ้าเป็น relative path
        if (url.startsWith('/')) {
          const finalUrl = `${baseUrl}${url}`
          console.log('✅ Relative path converted:', finalUrl)
          return finalUrl
        }
        
        // Default fallback
        console.log('🏠 Using baseUrl as fallback:', baseUrl)
        return baseUrl
        
      } catch (error) {
        console.error('❌ Redirect URL parsing error:', error)
        console.log('🏠 Using baseUrl due to error:', baseUrl)
        return baseUrl
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 