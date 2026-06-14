import { NextResponse } from 'next/server';

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  let cleanMessage = message;

  // Detect database connection/availability issues
  if (
    message.includes('Can\'t reach database server') ||
    message.includes('database server is running') ||
    message.includes('pooler.supabase.com') ||
    message.includes('Can\'t reach database')
  ) {
    cleanMessage = 'Database connection failed. Please ensure your database server is running and accessible.';
  }
  // Detect other internal Prisma execution/schema errors
  else if (
    message.includes('prisma') ||
    message.includes('Prisma') ||
    message.includes('invocation in') ||
    message.includes('findUnique') ||
    message.includes('findMany') ||
    message.includes('count')
  ) {
    cleanMessage = 'A database error occurred. Please check your connection or try again later.';
  }
  // Detect raw next.js/Turbopack stack traces and path leakage
  else if (
    message.includes('__TURBOPACK__') ||
    message.includes('ecmascript') ||
    message.includes('.js:') ||
    message.includes('module')
  ) {
    cleanMessage = 'An unexpected system error occurred. Please try again later.';
  }

  const body: Record<string, unknown> = {
    success: false,
    error: cleanMessage,
  };
  if (errors !== undefined && errors !== null) {
    body.errors = errors;
  }
  return NextResponse.json(body, { status });
}

