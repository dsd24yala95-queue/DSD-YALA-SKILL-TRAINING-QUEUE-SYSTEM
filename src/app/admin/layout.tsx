import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ForceChangePasswordModal from "@/components/ForceChangePasswordModal";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#f1f5f9]">
            <AdminSidebar />
            <main className="flex-1 overflow-auto min-w-0 flex flex-col">
                <AdminHeader />
                <div className="flex-1">
                    {children}
                </div>
            </main>
            <ForceChangePasswordModal />
        </div>
    );
}