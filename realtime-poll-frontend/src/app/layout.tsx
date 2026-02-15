import type { Metadata } from "next";
import { Poppins } from "next/font/google"; //  Poppins font family from Google Fonts
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
        className={`${poppins.className} antialiased bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-700`}
      >
        {/* PREMIUM BACKGROUND GLOW */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>

        <Navbar />

        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Added 'font-bold' to make Poppins look extra crisp here */}
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">
          Pollify
        </h1>

        <div className="space-x-6 text-sm font-medium text-slate-600">
          <a href="/" className="hover:text-indigo-600 transition-colors">Home</a>
          <a href="/create" className="hover:text-indigo-600 transition-colors">Create Poll</a>
        </div>
      </div>
    </nav>
  );
}