import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      restaurantId?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    restaurantId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    restaurantId?: string
  }
} 