import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth?.token as any)?.role as string | undefined;

    // Protect /admin/* for ADMIN only
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    // Protect /approvals for APPROVER or ADMIN
    if (pathname.startsWith("/approvals")) {
      if (!(role === "APPROVER" || role === "ADMIN")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // require auth by default
    }
  }
);

export const config = {
  matcher: ["/((?!api|_next|auth|public|manifest.json|icons|favicon.ico).*)"]
};
