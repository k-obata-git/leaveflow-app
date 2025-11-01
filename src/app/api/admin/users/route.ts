import { prisma } from "@/lib/prisma";
import { handleRequest } from "@/lib/server/apiHandler";
import { validUserSchema } from "@/lib/server/validation";
import { ValidationError } from "@/lib/server/errors";

/**
 * ユーザ登録更新
 * @param req 
 * @returns 
 */
export async function POST(req: Request) {
  return handleRequest(req, true, async (req) => {
    // パラメータのバリデーションチェック
    const body = await req.json();
    const validUser = validUserSchema.safeParse(body);
    if (!validUser.success) {
      throw new ValidationError(validUser.error.errors[0].message);
    }

    const { userId, name, email, role, startDate, workDaysPerWeek } = validUser.data;

    if(userId) {
      const user = await prisma.$transaction(async (tx) => {
        const res = await tx.user.update({
          where: {
            id: userId
          },
          data: {
            name,
            role,
          },
        });

        await tx.employeeProfile.upsert({
          where: {
            userId: userId
          },
          create: {
            userId: userId,
            startDate: startDate ? new Date(startDate) : new Date(),
            workDaysPerWeek: Math.max(1, Math.min(5, Number(workDaysPerWeek) || 5))
          },
          update: {
            startDate: startDate ? new Date(startDate) : new Date(),
            workDaysPerWeek: Math.max(1, Math.min(5, Number(workDaysPerWeek) || 5))
          }
        })

        return res;
      })

      return user;
    } else {
      const target = await prisma.user.findUnique({
        where: {
          email
        }
      });
      if (target) {
        return new Response("Conflict", { status: 409 });
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          role,
          profile: {
            create: {
              startDate: startDate ? new Date(startDate) : new Date(),
              workDaysPerWeek: Math.max(1, Math.min(5, Number(workDaysPerWeek) || 5))
            }
          },
          leaveBalances: {
            create: {
              currentDays: 0
            }
          }
        }
      })

      return user;
    }
  })
}
