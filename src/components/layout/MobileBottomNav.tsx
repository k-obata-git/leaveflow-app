"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEarmarkPlus, Gear, House, ListCheck } from "react-bootstrap-icons";

type Prors = {
  user: any
}

export default function MobileBottomNav({user} : Prors) {
  const pathname = usePathname();
  const act = (href: string) => {
    if(pathname === "/requests/new") {
      return pathname === href ? "active" : "";
    }

    return pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : "";
  }

  return (
    <nav className={`${user?.role === "ADMIN" ? "mobile-bottom-nav admin" : "mobile-bottom-nav"}`} aria-label="主要ナビゲーション">
      <Link href="/" className={`item ${act("/")}`}>
        <House className="mnav-ico" />
        {/* <span className="label">ホーム</span> */}
      </Link>

      <Link href="/requests/new" className={`item ${act("/requests/new")}`}>
        <FileEarmarkPlus className="mnav-ico" />
        {/* <span className="label">新規</span> */}
      </Link>

      <Link href="/requests" className={`item ${act("/requests")}`}>
        <ListCheck className="mnav-ico" />
        {/* <span className="label">一覧</span> */}
      </Link>

      {user?.role === "ADMIN" && (
        <Link href="/admin" className={`item ${act("/admin")}`}>
          <Gear className="mnav-ico" />
          {/* <span className="label">管理</span> */}
        </Link>
      )}
    </nav>
  );
}
