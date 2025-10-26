'use server'

import RequestClient from "@/features/requests/RequestClient";

export default async function ResubmitPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <RequestClient requestId={params.id} />
  );
}
