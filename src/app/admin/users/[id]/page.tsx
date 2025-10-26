'use server'

import AdminUserEditClient from "@/components/admin/AdminUserEditClient";

type Props = {
  params: Promise<{ id: string }>;
}

export default async function EditUser({ params }: Props) {
  const { id } = await params;
  return (
    <AdminUserEditClient userId={id} />
  );
}