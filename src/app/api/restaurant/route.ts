import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        categories: {
          where: {
            isActive: true
          },
          orderBy: {
            sortOrder: 'asc'
          },
          include: {
            menuItems: {
              where: {
                isAvailable: true
              },
              orderBy: {
                sortOrder: 'asc'
              }
            }
          }
        }
      }
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลร้านอาหารได้' },
      { status: 500 }
    );
  }
} 