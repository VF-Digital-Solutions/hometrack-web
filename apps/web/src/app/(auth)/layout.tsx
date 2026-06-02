export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#EAE6DD] tracking-widest uppercase">
            HomeTrack
          </h1>
          <p className="text-[#5A6A5A] text-sm mt-2">
            La evolución de la agenda.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

