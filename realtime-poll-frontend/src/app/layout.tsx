import type { Metadata } from "next";
import { Poppins } from "next/font/google"; //  Poppins font family from Google Fonts
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import NavbarAuth from "@/components/NavbarAuth";
import "./globals.css";

// 2. Configure Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // font weights
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pollify - Instant Voting",
  description: "Real-time voting application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // 3. Apply 'poppins.className' here. 
        // This instantly sets the font-family for the whole app.
        className={`${poppins.className} antialiased bg-[#f0e8d0] text-slate-900 selection:bg-green-100 selection:text-green-800`}
      >
        <AuthProvider>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#1e293b',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#1a6b3a',
                  secondary: '#fff',
                },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* PREMIUM BACKGROUND GLOW */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#f0e8d0]">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(107,145,112,0.3),rgba(255,255,255,0))]"></div>
        </div>

        <Navbar />

        <div className="relative">
          {children}
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-green-100 bg-white/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Added 'font-bold' to make Poppins look extra crisp here */}
        <h1 className="text-xl font-bold tracking-tight text-[#1a6b3a]">
          Pollify
        </h1>

        <div className="flex items-center gap-6">
          <div className="space-x-6 text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-[#1a6b3a] transition-colors">Home</a>
            <a href="/create" className="hover:text-[#1a6b3a] transition-colors">Create Poll</a>
          </div>
          <NavbarAuth />
        </div>
      </div>
    </nav>
  );
}