import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

/**
 * 共通APIハンドラ
 * - 例外処理
 * - ステータスコードの制御
 * - JSONレスポンスの統一
 */
export async function handleRequest<T>(
  req: Request,
  isAdmin: boolean,
  handler: (req: Request) => Promise<T>,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const me = session?.user as any;
    if (isAdmin && me.role !== "ADMIN") {
      throw new ApiError(403, "Forbidden");
    }

    const data = await handler(req);
    if(req.method === "DELETE") {
      return new NextResponse(
        null,
        {
          status: 204,
        }
      );
    } else {
      return NextResponse.json(
        {
          ok: true,
          data
        },
        {
          status: 200,
        }
      );
    }
  } catch (err) {
    console.error("[API Error]", err);

    if (err instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message
        },
        {
          status: err.status
        }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Internal Server Error"
      },
      {
        status: 500
      }
    );
  }
}
