"use client";
import { ArrowRight, BarChart2, CheckCircle2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [quickQuestion, setQuickQuestion] = useState("");
  const router = useRouter();
  const handleQuickCreate = () => {
    if (!quickQuestion.trim()) return;
    const params = new URLSearchParams({ question: quickQuestion.trim() });
    router.push(`/create?${params.toString()}`);
  };
  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gray-50 flex flex-col justify-center">

      {/* Background Decor: Subtle Grid & gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 top-0 -z-10 h-full w-full bg-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-green-50 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[500px] w-[500px] rounded-full bg-green-100 blur-3xl opacity-60"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Polling Platform
        </div>

        {/* Hero Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
          Instant Feedback, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a6b3a] to-[#166534]">
            Real-time Decisions.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Create beautiful, anonymous polls in seconds. No login required.
          Just type your question and share the link.
        </p>

        {/* Quick Start Interface (Center of attention) */}
        <div className="max-w-xl mx-auto mt-10">
          <div className="p-2 bg-white rounded-2xl shadow-xl shadow-green-100/50 border border-gray-200 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={quickQuestion}
              onChange={e => setQuickQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 font-medium"
            />
            <button
              onClick={handleQuickCreate}
              className="px-6 py-3 bg-[#1a6b3a] hover:bg-[#166534] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Create Poll
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400 font-medium flex justify-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Free Forever</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> No Credit Card</span>
          </p>
        </div>

        {/* Visual Proof / Floating Card */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent z-10"></div>

          {/* Mockup Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-2xl max-w-sm mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">Review Poll</p>
                  <p className="text-[10px] text-gray-400">Ends in 24h</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-left mb-4">Which design style do you prefer?</h3>
            <div className="space-y-2">
              <div className="w-full bg-green-50 p-3 rounded-lg border border-green-100 flex justify-between items-center">
                <span className="text-sm font-medium text-green-900">Minimalist</span>
                <span className="text-sm font-bold text-green-700">64%</span>
              </div>
              <div className="w-full bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center opacity-60">
                <span className="text-sm font-medium text-gray-600">Brutalist</span>
                <span className="text-sm font-bold text-gray-400">36%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}