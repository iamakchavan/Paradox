'use client';

export default function AuthLoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 select-none font-sans">
      <div className="relative w-10 h-10 mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-t-zinc-100 border-l-zinc-100 border-r-transparent border-b-transparent animate-spin" />
      </div>
      <h2 className="text-sm font-semibold tracking-wide text-zinc-200 mb-1">
        Connecting to Service...
      </h2>
      <p className="text-xs text-zinc-500 max-w-xs text-center leading-relaxed">
        Please wait while we establish secure authentication.
      </p>
    </div>
  );
}
