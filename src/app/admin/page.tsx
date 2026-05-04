import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSiteData } from "@/lib/repository";

export default async function AdminPage() {
  const allowed = await isAdminAuthenticated();
  if (!allowed) {
    redirect("/admin/login");
  }

  const data = await getSiteData();
  return <AdminPanel initialData={data} />;
}
