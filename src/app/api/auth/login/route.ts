import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { loginSchema } from '@/lib/validation';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const { email, password } = result.data;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        merchant: true,
      },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify the password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate token
    const token = signToken({ userId: user.id, role: user.role });

    // Set HTTP-only JWT cookie
    await setAuthCookie(token);

    // Safe response without passwordHash
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      merchant: user.merchant,
    };

    return successResponse({ user: safeUser });
  } catch (err) {
    const error = err as Error;
    console.error('Login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
