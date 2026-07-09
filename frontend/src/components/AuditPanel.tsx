import React from "react";

type Log = {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  target_table: string;
  details?: string | null;
};

export default function AuditPanel({ logs }: { logs: Log[] }) {
  return (
    <div className="bg-purple-955/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
        <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">System Audit Ledger</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead>
            <tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">Timestamp</th><th className="pb-2">Operator</th><th className="pb-2">Action</th><th className="pb-2">Target Table</th><th className="pb-2">Details</th></tr>
          </thead>
          <tbody className="divide-y divide-purple-900/10 font-mono text-[11px]">
            {logs.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-purple-500/40">NO SECURITY TELEMETRY ENTRIES INDEXED</td></tr> : logs.map(l => (
              <tr key={l.id} className="text-zinc-300 hover:bg-purple-955/5 transition-colors">
                <td className="py-3 text-zinc-500">{new Date(l.created_at).toLocaleString()}</td>
                <td className="py-3 text-purple-400 font-bold">{l.actor}</td>
                <td className="py-3">
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/30 text-purple-200 border border-purple-900/40 text-[10px]">{l.action}</span>
                </td>
                <td className="py-3 text-zinc-400">{l.target_table}</td>
                <td className="py-3 text-zinc-400 truncate max-w-xs">{l.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}