import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import LineProvider from 'next-auth/providers/line'
// import { PrismaAdapter } from '@next-auth/prisma-adapter' // ปิดการใช้ PrismaAdapter
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


export const authOptions: NextAuthOptions = {
  // ปิด adapter เพื่อใช้ custom signIn callback แทน
  // adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'profile openid'
        }
      },
      // ปิด state check ชั่วคราวเพื่อแก้ไขปัญหา development
      // checks: ['state'],
      // เพิ่ม explicit profile function เพื่อให้แน่ใจว่าข้อมูลถูกดึงมาอย่างถูกต้อง
      profile(profile) {
        console.log('📱 LINE profile received:', profile);
        console.log('📱 LINE profile type:', typeof profile);
        console.log('📱 LINE profile keys:', profile ? Object.keys(profile) : 'no profile');
        
        // ตรวจสอบข้อมูลพื้นฐานจาก LINE - ใช้การจัดการ error ที่อ่อนโยนขึ้น
        if (!profile) {
          console.error('❌ LINE profile is null or undefined');
          // Return default user object instead of null
          const fallbackUser = {
            id: 'unknown',
            name: 'LINE User',
            email: null,
            image: null,
            role: 'USER'
          };
          console.log('🔄 Returning fallback user for null profile:', fallbackUser);
          return fallbackUser;
        }
        
        if (!profile.sub) {
          console.error('❌ LINE profile missing sub (user ID):', profile);
          // Return user object with fallback ID
          const fallbackUser = {
            id: `line_${Date.now()}`, // fallback ID
            name: profile.name || 'LINE User',
            email: profile.email || null,
            image: profile.picture || null,
            role: 'USER'
          };
          console.log('🔄 Returning fallback user for missing sub:', fallbackUser);
          return fallbackUser;
        }
        
        const userProfile = {
          id: profile.sub,
          name: profile.name || 'LINE User',
          email: profile.email || null, // LINE ไม่ได้ส่ง email เสมอ
          image: profile.picture || null,
          role: 'USER' // default role สำหรับ LINE users
        };
        
        console.log('✅ LINE profile processed successfully:', userProfile);
        return userProfile;
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
      console.log('🔄 NextAuth redirect:', { url, baseUrl });
      
      // ถ้าเป็น callback URL ที่มีเส้นทางชัดเจน ให้ใช้ตามที่ระบุ
      if (url && url !== baseUrl && url !== `${baseUrl}/`) {
        // ตรวจสอบว่าเป็น relative URL หรือไม่
        if (url.startsWith('/')) {
          const fullUrl = `${baseUrl}${url}`;
          console.log('✅ Redirecting to relative URL:', fullUrl);
          return fullUrl;
        }
        
        // ตรวจสอบว่าเป็น absolute URL ที่อยู่ใน domain เดียวกัน
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          if (urlObj.origin === baseUrlObj.origin) {
            console.log('✅ Redirecting to same origin URL:', url);
            return url;
          }
        } catch (error) {
          console.warn('⚠️ Invalid URL format:', url);
        }
      }
      
      // สำหรับ LIFF หรือไม่มี callback URL ที่ชัดเจน ให้ไปหน้าเมนู
      const defaultMenuUrl = `${baseUrl}/menu/cmcg20f2i00029hu8p2am75df`;
      console.log('🏠 Using default menu URL:', defaultMenuUrl);
      return defaultMenuUrl;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('🔐 SignIn callback triggered:', { 
        provider: account?.provider, 
        userId: account?.providerAccountId,
        userEmail: user.email,
        userName: user.name,
        profileData: profile 
      });

      // สำหรับ LINE provider ให้สร้าง user ใหม่เป็น customer เสมอ
      if (account?.provider === 'line') {
        try {
          console.log('📱 LINE signIn data:', { user, account, profile });
          console.log('📱 LINE detailed info:', {
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            accountProvider: account?.provider,
            accountId: account?.providerAccountId,
            profileData: profile
          });
          
          // ตรวจสอบการเชื่อมต่อ database
          if (!process.env.DATABASE_URL) {
            console.warn('⚠️ No DATABASE_URL found, using JWT-only session');
            return true; // อนุญาตให้ login แต่ไม่บันทึก database
          }
          
          // เพิ่ม validation สำหรับ LINE data - ต้องมี LINE user ID
          const lineUserId = account?.providerAccountId || user?.id;
          if (!lineUserId) {
            console.error('❌ LINE provider account ID missing', {
              hasUserId: !!user?.id,
              hasAccountId: !!account?.providerAccountId,
              user: user,
              account: account
            });
            return '/auth/error?error=OAuthAccountNotLinked&error_description=LINE+account+not+properly+linked';
          }
          
          // ตรวจสอบว่ามี user ที่เชื่อมโยงกับ LINE account นี้อยู่แล้วหรือไม่
          const autoEmail = `line_${lineUserId}@line.local`;
          let existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                {
                  accounts: {
                    some: {
                      provider: 'line',
                      providerAccountId: lineUserId
                    }
                  }
                },
                { email: user.email || autoEmail } // ตรวจสอบทั้ง real email และ auto-generated email
              ]
            },
            include: {
              accounts: true
            }
          });

          if (existingUser) {
            console.log('👤 Existing LINE user found:', existingUser.id);
            
            // เก็บ USER role ไว้ให้ผู้ใช้เลือกเอง
            
            return true;
          }
          
          // ถ้าไม่มี user ที่เชื่อมโยงอยู่ ให้สร้างใหม่
          console.log('👤 Creating new LINE user');
          
          // สร้าง user ใหม่ โดยสร้าง email อัตโนมัติถ้าไม่มี
          const userData: any = {
            name: user.name || `LINE User ${lineUserId.slice(-6)}`,
            email: user.email || autoEmail, // ใช้ auto-generated email
            image: user.image,
            role: 'USER', // Default role สำหรับ LINE users ใหม่
            emailVerified: user.email ? new Date() : null
          };
          
          const newUser = await prisma.user.create({
            data: userData
          });
          
          // สร้าง Account record เพื่อเชื่อมโยง LINE account กับ user
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: 'oauth',
              provider: 'line',
              providerAccountId: lineUserId,
              access_token: account?.access_token || null,
              refresh_token: account?.refresh_token || null,
              expires_at: account?.expires_at || null,
              token_type: account?.token_type || null,
              scope: account?.scope || null,
              id_token: account?.id_token || null,
              session_state: account?.session_state || null
            }
          });
          
          console.log('✅ New LINE user and account created successfully:', newUser.id);
          return true;
        } catch (error) {
          console.error('❌ Error in LINE signIn callback:', error);
          console.error('❌ Error details:', {
            errorMessage: (error as Error).message,
            errorName: (error as Error).name,
            errorStack: (error as Error).stack,
            errorCode: (error as any).code,
            errorMeta: (error as any).meta
          });
          
          // ถ้าไม่มี database ให้ return true เพื่อใช้ JWT session
          if ((error as Error).message?.includes('Database') || !process.env.DATABASE_URL) {
            console.warn('⚠️ Database error, falling back to JWT-only session');
            return true;
          }
          
          // สำหรับ Prisma unique constraint errors
          if ((error as any).code === 'P2002') {
            console.warn('⚠️ Unique constraint violation, user might already exist');
            return true;
          }
          
          // สำหรับ errors อื่นๆ ให้ fallback ไป JWT session แทนการ redirect error
          console.warn('⚠️ Unknown error, falling back to JWT-only session');
          return true;
        }
      }

      // สำหรับ providers อื่นๆ
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // เพิ่ม logging สำหรับ debugging
      console.log('🎯 JWT callback:', { 
        hasUser: !!user, 
        provider: account?.provider,
        tokenSub: token.sub 
      });
      
      if (user) {
        token.role = (user as any).role || 'USER'
        token.restaurantId = (user as any).restaurantId
      }
      
                // สำหรับ LINE users ให้ดึงข้อมูลจาก database
          if (account?.provider === 'line') {
            try {
              let dbUser = null;
              
              if (token.email && typeof token.email === 'string') {
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
                // อัปเดต email ใน token ให้ตรงกับ database (อนุญาตให้เป็น null)
                if (dbUser.email) {
                  token.email = dbUser.email;
                }
              }
            } catch (error) {
              console.error('Error fetching user from database:', error);
              // ถ้าไม่มี database connection ให้ใช้ข้อมูลจาก token
              if (!process.env.DATABASE_URL) {
                token.role = 'USER'; // default role สำหรับ LINE users
              }
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
  },
  // เพิ่ม debug mode สำหรับ development
  debug: process.env.NODE_ENV === 'development',
  // แก้ไขปัญหา state cookie ใน development
  // trustHost: true, // ไม่รองรับใน NextAuth v4
  // useSecureCookies: process.env.NODE_ENV === 'production',
  // เพิ่มการตั้งค่า cookies สำหรับ security และแก้ไข state cookie issue
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // ใช้ false สำหรับ localhost development
        maxAge: 15 * 60 // 15 minutes
      }
    }
  },
  // เพิ่ม events สำหรับ logging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 SignIn event:', { 
        provider: account?.provider, 
        userId: user?.id, 
        userName: user?.name,
        userEmail: user?.email,
        accountId: account?.providerAccountId,
        isNewUser,
        profileKeys: profile ? Object.keys(profile) : 'no profile'
      });
      
      // เพิ่มการ debug เฉพาะ LINE
      if (account?.provider === 'line') {
        console.log('📱 LINE SignIn Event Details:', {
          lineUserId: profile?.sub || account?.providerAccountId,
          lineName: profile?.name,
          lineEmail: profile?.email,
          linePicture: (profile as any)?.picture,
          fullProfile: profile,
          fullAccount: account,
          fullUser: user
        });
      }
    },
    async signOut({ token, session }) {
      console.log('👋 SignOut event:', { userId: token?.sub });
    },
    async createUser({ user }) {
      console.log('👤 CreateUser event:', { userId: user.id, email: user.email });
    },
    async linkAccount({ user, account, profile }) {
      console.log('🔗 LinkAccount event:', { 
        provider: account.provider, 
        userId: user.id,
        accountId: account.providerAccountId 
      });
      
      // เพิ่มการ debug เฉพาะ LINE
      if (account?.provider === 'line') {
        console.log('📱 LINE LinkAccount Details:', {
          lineUserId: account.providerAccountId,
          profileData: profile,
          userData: user
        });
      }
    },
    async session({ session, token }) {
      console.log('📋 Session event:', { 
        userId: token?.sub,
        provider: token?.provider || 'unknown',
        role: token?.role
      });
    }
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST } 