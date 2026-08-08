import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import OfflineDetector from "@/components/OfflineDetector";
import PwaRegistrar from "@/components/PwaRegistrar";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import IosPwaGuideModal from "@/components/IosPwaGuideModal";
import LayoutContent from "@/components/LayoutContent";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import QueueAlertModal from "@/components/QueueAlertModal";
import { Toaster } from "sonner";
import ImmigrationCheckpointGuard from "@/components/ImmigrationCheckpointGuard";

export const metadata: Metadata = {
  title: "สพร.24 ยะลา — ระบบรับสมัครและจองคิวพัฒนาฝีมือแรงงาน",
  description:
    "สำนักงานพัฒนาฝีมือแรงงานยะลา (สพร.24) ระบบรับสมัครทดสอบมาตรฐานฝีมือแรงงานและฝึกอบรมพัฒนาทักษะ",
  keywords: ["พัฒนาฝีมือแรงงาน", "สพร.24", "ยะลา", "ทดสอบมาตรฐาน", "ฝึกอบรม"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DSD YALA",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "สพร.24 ยะลา — ระบบจองคิวพัฒนาฝีมือแรงงาน",
    description: "สมัครทดสอบมาตรฐานฝีมือแรงงานและฝึกอบรม พร้อมระบบจองคิวออนไลน์",
    type: "website",
    locale: "th_TH",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3C74",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased" data-theme="light" style={{colorScheme: "light"}} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DSD YALA" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        {/* Force light theme: clear any stored dark mode preference */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            document.documentElement.setAttribute('data-theme', 'light');
            document.documentElement.style.colorScheme = 'light';
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-[#2563EB]/30">
        <PwaRegistrar />
        <PwaInstallPrompt />
        <IosPwaGuideModal />
        <OfflineDetector />
        <AuthProviderWrapper>
          <ImmigrationCheckpointGuard>
            <QueueAlertModal />
            <LayoutContent>
              {children}
            </LayoutContent>
          </ImmigrationCheckpointGuard>
        </AuthProviderWrapper>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}