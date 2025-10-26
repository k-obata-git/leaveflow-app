import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./layout.css";
import Link from "next/link";
import { ReactNode } from "react";
import { Container, Navbar, Nav, NavbarToggle, NavbarCollapse, NavbarBrand, } from "react-bootstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "@/app/providers";
import ClientProviders from "@/components/providers/ClientProviders";
import SideNav from "@/components/layout/SideNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import SignInCard from "@/components/login/SignInCard";
import SubscribePushButton from "@/components/SubscribePushButton";
import SignInOutButton from "@/components/login/SignInOutButton";
import { LoadingProvider } from "@/components/providers/LoadingProvider";

export const metadata = {
  title: "LeaveFlow",
  description: "Leave request workflow app",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any | undefined;

  return (
    <html lang="ja">
      <body>
        <Providers>
          <ClientProviders>
            <LoadingProvider>
              {session?.user &&
                <>
                  <Navbar bg="light" expand="md" className="shadow-sm" sticky="top">
                    <Container fluid>
                      <NavbarBrand href="/">有給ワークフロー</NavbarBrand>
                        <Nav className="ms-auto align-items-center">
                          <SignInOutButton />
                        </Nav>
                    </Container>
                  </Navbar>
                  <div className="app-layout d-flex">
                    {/* 左サイドナビ（md以上で表示） */}
                    <SideNav user={user} />
                    {/* メインコンテンツ */}
                    <div className="flex-grow-1 p-3" style={{marginBottom: "64px"}}>
                      {children}
                    </div>
                  </div>
                  {/* モバイル専用ボトムナビ */}
                  <MobileBottomNav user={user} />
                </>
              }
              {!session?.user && 
                <SignInCard />
              }
            </LoadingProvider>
          </ClientProviders>
        </Providers>
      </body>
    </html>
  );


  return (
    <html lang="ja">
      <body>
        <Providers>
          <ClientProviders>
          <Navbar bg="light" expand="lg" className="mb-3">
            <Container>
              <Link href="/" className="navbar-brand">LeaveFlow</Link>
              <NavbarToggle aria-controls="basic-navbar-nav" />
              <NavbarCollapse id="basic-navbar-nav">
                {/* <Nav className="me-auto">
                  <Link className="nav-link" href="/requests">申請一覧</Link>
                  {(user?.role === "APPROVER" || user?.role === "ADMIN") && (
                    <Link className="nav-link" href="/approvals">承認待ち</Link>
                  )}
                  {user?.role === "ADMIN" && (
                    <Link className="nav-link" href="/admin">管理</Link>
                  )}
                </Nav> */}
                <Nav className="ms-auto align-items-center">
                  {/* <Link href="/requests/new" className="btn btn-primary me-2">申請作成</Link> */}
                  <div className="d-flex gap-2">
                    <SubscribePushButton />
                    <SignInOutButton />
                  </div>
                </Nav>
              </NavbarCollapse>
            </Container>
          </Navbar>
          <Container>{children}</Container>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        </ClientProviders>
        </Providers>
      </body>
    </html>
  );
}
