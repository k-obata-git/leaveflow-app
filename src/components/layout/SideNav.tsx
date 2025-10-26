"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEarmarkPlus, ListCheck, Gear, House, } from "react-bootstrap-icons";

type Prors = {
  user: any
}

export default function SideNav({user} : Prors) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if(pathname === "/requests/new") {
      return pathname === href;
    }

    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  const links = [
    { href: "/", label: "ホーム", icon: <House /> },
    { href: "/requests/new", label: "新規", icon: <FileEarmarkPlus /> },
    { href: "/requests", label: "一覧", icon: <ListCheck /> },
  ];
  if (user?.role === "ADMIN") {
    links.push({ href: "/admin", label: "管理", icon: <Gear /> });
  }

  return (
    <aside className="sidenav-mini flex-column align-items-center py-3 border-end">
      {/* <div className="mb-4 fw-bold small">WF</div> */}

      <nav className="flex-column d-flex gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`snav-mini-link ${isActive(l.href) ? "active" : ""}`}
          >
            <div className="icon">{l.icon}</div>
            <div className="label">{l.label}</div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
