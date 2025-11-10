'use client';

interface EmptyIndustryStateProps {
  icon: string;
  title: string;
  message: string;
}

export function EmptyIndustryState({ icon, title, message }: EmptyIndustryStateProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">{icon}</div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
          <p className="text-slate-400">{message}</p>
        </div>
      </div>
    </section>
  );
}

