import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { registerSchema } from "@/lib/validation";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        "Validation error",
        400,
        result.error.flatten().fieldErrors,
      );
    }

    const {
      name,
      email,
      password,
      businessName,
      businessType,
      businessCategory,
      location,
    } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse("Email already registered", 400);
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      return tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          merchant: {
            create: {
              businessName,
              businessType,
              businessCategory,
              location,
            },
          },
        },
        include: {
          merchant: true,
        },
      });
    });

    // Generate token
    const token = signToken({ userId: user.id, role: user.role });

    // Set HTTP-only JWT Cookie
    await setAuthCookie(token);

    // Exclude passwordHash from returned response
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      merchant: user.merchant,
    };

    return successResponse({ user: safeUser }, 201);
  } catch (err) {
    const error = err as Error;
    console.error("Registration error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
