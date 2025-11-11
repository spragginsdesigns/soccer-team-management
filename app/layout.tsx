import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "Soccer Team Assessment Manager",
  description: "Track your soccer team's development throughout the season",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
