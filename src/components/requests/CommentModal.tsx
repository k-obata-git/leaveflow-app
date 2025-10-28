"use client";

import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

type Props = {
  show: boolean;
  title: string;
  note?: string;
  doneButtonLabel: string;
  onClose: () => void;
  onDone: (comment: string) => void;
};

export default function ApproveModal({ show, title, note, doneButtonLabel, onClose, onDone }: Props) {
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    setComment("");
  }, [show]);

  return (
    <Modal show={show} onHide={() => onClose()}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {note && (
          <p className="text-muted small">{note}</p>
        )}
        <Form.Group>
          <Form.Control
            as="textarea"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメントを入力（任意）"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button className="flex-fill flex-sm-grow-0" variant="secondary" onClick={onClose}>キャンセル</Button>
        <Button className="flex-fill flex-sm-grow-0" onClick={() => onDone(comment)}>{doneButtonLabel}</Button>
      </Modal.Footer>
    </Modal>
  )
}
