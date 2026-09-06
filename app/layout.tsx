import type { Metadata } from "next";
import "./globals.css";
import "./madonna-admin.css";

export const metadata: Metadata = {
  title: "Madonna | مساحة الجمال",
  description: "عناية بتوقيع Madonna Beauty Lounge. اختاري طقوسكِ واحجزي لحظتكِ في عمّان.",
  icons: {
    icon: "/brand/logo.png",
    shortcut: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
