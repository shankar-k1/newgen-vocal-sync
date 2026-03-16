import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VocalSync AI | Universal Audio Translator",
  description: "Upload, convert, transcribe, and translate any audio with premium AI engines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="app-shell">
            <header className="site-header">
              <div className="container">
                <a href="/" className="logo">VocalSync <span className="logo-accent">AI</span></a>
                <nav className="site-nav">
                  <a href="/">Home</a>
                  <a href="/admin">Admin</a>
                  <a href="/auth/signin">Sign in</a>
                </nav>
              </div>
            </header>

            <main className="main-container">
              <div className="container">{children}</div>
            </main>

            <footer className="site-footer">
              <div className="container">© {new Date().getFullYear()} VocalSync AI — Built with ❤️</div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
