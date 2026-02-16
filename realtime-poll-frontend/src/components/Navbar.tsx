"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavbarAuth from "@/components/NavbarAuth";

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-green-100 bg-white/70 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-[#1a6b3a]"
                    onClick={() => setOpen(false)}
                >
                    Pollify
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <div className="space-x-6 text-sm font-medium text-slate-600">
                        <Link href="/" className="hover:text-[#1a6b3a] transition-colors">
                            Home
                        </Link>
                        <Link href="/create" className="hover:text-[#1a6b3a] transition-colors">
                            Create Poll
                        </Link>
                    </div>
                    <NavbarAuth />
                </div>

                <button
                    type="button"
                    className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    onClick={() => setOpen((prev) => !prev)}
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <div className={open ? "md:hidden border-t border-green-100 bg-white/95" : "hidden md:hidden"}>
                <div className="px-6 py-4 flex flex-col gap-4">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-slate-700 hover:text-[#1a6b3a] transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        href="/create"
                        className="text-sm font-semibold text-slate-700 hover:text-[#1a6b3a] transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        Create Poll
                    </Link>
                    <div className="pt-2">
                        <NavbarAuth />
                    </div>
                </div>
            </div>
        </nav>
    );
}
