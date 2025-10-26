"use client";

import { Button } from "react-bootstrap";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInOutButton() {
  const { data: session } = useSession();
  if (session) {
    return <Button size="sm" variant="outline-secondary" onClick={() => signOut()}>サインアウト</Button>;
  }
  return <Button size="sm" onClick={() => signIn()}>サインイン</Button>;
}
