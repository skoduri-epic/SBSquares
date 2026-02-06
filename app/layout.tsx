import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Super Bowl Squares",
  description: "Chemicos2k Super Bowl Squares Pool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sb-theme");if(!t||t==="dark")document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark")}catch(e){document.documentElement.classList.add("dark")}})()`,
          }}
        />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
