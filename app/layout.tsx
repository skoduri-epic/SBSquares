import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Super Bowl Squares",
  description: "Super Bowl Squares Pool",
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
            __html: `(function(){try{var t=localStorage.getItem("sb-theme");if(t==="light")document.documentElement.classList.remove("dark");else if(t==="system"){if(!window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.remove("dark");else document.documentElement.classList.add("dark")}else document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})()`,
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
