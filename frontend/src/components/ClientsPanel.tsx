import React from "react";

type Client = {
  id: string;
  name: string;
  company?: string | null;
  email: string;
};

export default function ClientsPanel({ clients }: { clients: Client[] }) {
  return (
    <div className="bg-[#070510]/40 border border-purple-500/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] rounded-xl p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Client Registries</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider"><th className="pb-3 font-medium">Client Name</th><th className="pb-3 font-medium">Corporate Entity</th><th className="pb-3 font-medium">Email Address</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/30 text-zinc-300">
            {clients.length === 0 ? <tr><td colSpan={3} className="py-6 text-center text-zinc-600 font-mono text-[11px]">NO CUSTOMER RECORDS MATCHED</td></tr> : clients.map(c => (
              <tr key={c.id} className="hover:bg-purple-500/[0.02] transition-colors duration-300 ease-out">
                <td className="py-3.5 font-medium text-zinc-100">{c.name}</td>
                <td className="py-3.5 text-zinc-400">{c.company || "Individual"}</td>
                <td className="py-3.5 font-mono text-[11px] text-purple-400/80">{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}