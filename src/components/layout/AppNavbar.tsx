"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, Nav, Container, Badge, Button } from "react-bootstrap";
import { signIn, signOut } from "next-auth/react";

type Prors = {
  user: any
}

export default function AppNavbar({user} : Prors) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Navbar bg="light" expand="md" className="shadow-sm" sticky="top">
      <Container fluid>
        <Navbar.Brand as={Link} href="/">有給ワークフロー</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/requests/new" active={isActive("/requests/new")}>
              新規申請
            </Nav.Link>
            <Nav.Link as={Link} href="/requests" active={isActive("/requests")}>
              申請一覧
            </Nav.Link>
            {user?.role === "ADMIN" && (
              <Nav.Link as={Link} href="/admin" active={isActive("/admin")}>
                管理
              </Nav.Link>
            )}
          </Nav>

          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-2">
                  {user.name || user.email}
                  {user.role && (
                    <Badge bg="secondary" className="ms-2">{user.role}</Badge>
                  )}
                </Navbar.Text>
                <Button size="sm" variant="outline-secondary" onClick={() => signOut()}>
                  ログアウト
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => signIn()}>ログイン</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
