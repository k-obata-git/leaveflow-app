'use server'

import RequestDetailClient from "@/features/requests/RequestDetailClient";

type Props = {
  params: Promise<{ id: string }>;
}

export default async function RequestDetail({ params }: Props) {
  const { id } = await params;
  return (
    <RequestDetailClient requestId={id} />
  );
}
