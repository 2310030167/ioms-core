import React from "react";

type Client = {
  id: string;
  name: string;
  company?: string | null;
  email: string;
};

export default function ClientsPanel({ clients }: { clients: Client[] }) {
  return (
    <div className="bg-purple-955/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
        <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Client Directories</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">Client Name</th><th className="pb-2">Corporate Entity</th><th className="pb-2">Email Address</th></tr>
          </thead>
          <tbody className="divide-y divide-purple-900/10">
            {clients.length === 0 ? <tr><td colSpan={3} className="py-4 text-center text-purple-500/40 font-mono">NO CUSTOMER SHEETS INDEXED</td></tr> : clients.map(c => (
              <tr key={c.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                <td className="py-3 font-semibold text-white">{c.name}</td>
                <td className="py-3 font-medium">{c.company || "Individual"}</td>
                <td className="py-3 font-mono">{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}