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
  const body: Record<string, unknown> = {
    success: false,
    error: message,
  };
  if (errors !== undefined && errors !== null) {
    body.errors = errors;
  }
  return NextResponse.json(body, { status });
}
