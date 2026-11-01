import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPage } from "@/features/admin/components/admin-page";
import { getAdminUser } from "@/lib/admin/is-admin";

export const metadata = { title: "Admin — SmartTrip" };

// Reads the signed-in user (runtime data), so it sits inside <Suspense>.
async function AdminGate() {
  if (!(await getAdminUser())) notFound(); // not an admin: the page looks like it does not exist
  return <AdminPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">…</p>}>
      <AdminGate />
    </Suspense>
  );
}
