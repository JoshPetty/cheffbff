import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChefBFF",
  description: "Share and discover amazing recipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}