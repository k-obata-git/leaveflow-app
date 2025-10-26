"use client";

import { Spinner } from "react-bootstrap";

export default function Loading() {
  return (
    <div role="status" aria-live="assertive"
        style={{position: "fixed", inset: 0, display: "grid",
        placeItems: "center", background: "rgba(220,220,220, 0.6)", zIndex: 9999}}>
      <Spinner animation="border"></Spinner>
    </div>
  );
}