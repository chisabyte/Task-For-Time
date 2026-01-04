import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task For Time - Build Habits, Not Conflict",
  description: "Replace constant conflict with a simple system. Kids earn minutes by completing tasks, and you approve with a tap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="light" lang="en">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-text-main dark:text-white font-display antialiased selection:bg-primary selection:text-text-main">
        {children}
      </body>
    </html>
  );
}
