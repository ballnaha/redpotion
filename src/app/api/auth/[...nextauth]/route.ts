import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import LineProvider from 'next-auth/providers/line'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // ปิด adapter ชั่วคราวถ้าไม่มี database
  adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'profile openid'
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            restaurant: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurant?.id
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect:', { url, baseUrl });
      
      // ถ้าเป็น LIFF และไม่มี specific callback ให้ไปหน้าเมนู
      const urlObj = new URL(url, baseUrl);
      const isLiffCallback = urlObj.searchParams.has('liff') || 
                           url.includes('liff=true') || 
                           url.includes('menu/');
      
      // หาก callback URL มี LIFF flag หรือเป็นการกลับจาก LINE login
      if (isLiffCallback) {
        // ถ้ามี callbackUrl ที่ระบุแล้ว ให้ใช้นั้น
        if (url.includes('/menu/')) {
          return url.startsWith('/') ? `${baseUrl}${url}` : url;
        }
        // ไม่งั้นให้ไปหน้าเมนูหลัก
        return `${baseUrl}/menu/cmcg20f2i00029hu8p2am75df`;
      }
      
      // หลังจาก LINE login สำเร็จและไม่มี callback specific
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/menu/cmcg20f2i00029hu8p2am75df`;
      }
      
      // Default redirect behavior
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback triggered:', { 
        provider: account?.provider, 
        userId: account?.providerAccountId,
        userEmail: user.email,
        userName: user.name 
      });

      // สำหรับ LINE provider ให้สร้าง user ใหม่เป็น customer เสมอ
      if (account?.provider === 'line') {
        try {
          console.log('📱 LINE signIn data:', { user, account, profile });
          
          // ตรวจสอบการเชื่อมต่อ database
          if (!process.env.DATABASE_URL) {
            console.warn('⚠️ No DATABASE_URL found, using JWT-only session');
            return true; // อนุญาตให้ login แต่ไม่บันทึก database
          }
          
          // ตรวจสอบว่ามี email หรือไม่
          if (!user.email) {
            console.log('📧 LINE user has no email, creating mock email');
            // ถ้าไม่มี email ให้ใช้ LINE user ID แทน
            const lineUserId = account.providerAccountId;
            const mockEmail = `line_${lineUserId}@line.local`;
            
            // ตรวจสอบว่ามี user อยู่แล้วหรือไม่ด้วย LINE ID
            const existingUser = await prisma.user.findFirst({
              where: { 
                OR: [
                  { email: mockEmail },
                  { 
                    accounts: {
                      some: {
                        provider: 'line',
                        providerAccountId: lineUserId
                      }
                    }
                  }
                ]
              }
            });

            if (!existingUser) {
              console.log('👤 Creating new LINE user with mock email');
              // สร้าง user ใหม่สำหรับ LINE login โดยใช้ mock email
              await prisma.user.create({
                data: {
                  email: mockEmail,
                  name: user.name || 'LINE User',
                  image: user.image,
                  role: 'USER',
                  emailVerified: new Date()
                }
              });
              console.log('✅ User created successfully');
            } else {
              console.log('👤 Existing LINE user found');
            }
            return true;
          }
          
          // ถ้ามี email ให้ทำงานปกติ
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            console.log('👤 Creating new LINE user with email');
            // สร้าง user ใหม่สำหรับ LINE login
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || 'LINE User',
                image: user.image,
                role: 'USER',
                emailVerified: new Date()
              }
            });
            console.log('✅ User created successfully');
          } else {
            console.log('👤 Existing user found');
          }
          return true;
        } catch (error) {
          console.error('❌ Error creating LINE user:', error);
          
          // ถ้าไม่มี database ให้ return true เพื่อใช้ JWT session
          if ((error as Error).message?.includes('Database') || !process.env.DATABASE_URL) {
            console.warn('⚠️ Database error, falling back to JWT-only session');
            return true;
          }
          
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.restaurantId = user.restaurantId
      }
      
      // สำหรับ LINE users ให้ดึงข้อมูลจาก database
      if (account?.provider === 'line') {
        try {
          let dbUser = null;
          
          if (token.email) {
            // ลองหาด้วย email ก่อน
            dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              include: { restaurant: true }
            });
          }
          
          // ถ้าไม่เจอ ให้ลองหาด้วย LINE account
          if (!dbUser && account.providerAccountId) {
            dbUser = await prisma.user.findFirst({
              where: {
                accounts: {
                  some: {
                    provider: 'line',
                    providerAccountId: account.providerAccountId
                  }
                }
              },
              include: { restaurant: true }
            });
          }
          
          if (dbUser) {
            token.role = dbUser.role;
            token.restaurantId = dbUser.restaurant?.id;
            // อัปเดต email ใน token ให้ตรงกับ database
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.restaurantId = token.restaurantId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 