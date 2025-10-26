"use client";

import { Button, Card, Col } from "react-bootstrap";
import { signIn } from "next-auth/react";

export default function SignInCard() {
  return (
    <div style={{paddingTop: "calc(50vh - 12rem)"}}>
      <Col md={{ span: 6, offset: 3 }} style={{height: "12rem"}}>
        <Card>
          <h3 className="text-center mt-4 mb-2">有給ワークフロー</h3>
          <Card.Body>
            <Button className="w-100 mb-2 bg-light text-body" variant="dark" onClick={() => signIn("google", {callbackUrl: "/"})}>Google でサインイン</Button>
            <Button className="w-100 mt-2 mb-2" variant="dark" onClick={() => signIn("github")}>GitHub でサインイン</Button>
          </Card.Body>
        </Card>
      </Col>
    </div>
  )
}
