import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let databaseHealthy = false;
  try {
    // Audit database connection via query raw select
    await prisma.$queryRaw`SELECT 1`;
    databaseHealthy = true;
  } catch (error) {
    console.error('Database health check failure:', error);
  }

  const geminiConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;

  return NextResponse.json(
    {
      status: databaseHealthy ? 'healthy' : 'degraded',
      api: 'healthy',
      database: databaseHealthy,
      geminiConfigured,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
    {
      status: databaseHealthy ? 200 : 503,
    }
  );
}
