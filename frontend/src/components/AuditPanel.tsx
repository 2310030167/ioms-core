import React from "react";
export default function AuditPanel({ logs }: { logs: any[] }) {
  return (
    <div className="bg-[#070510]/40 border border-purple-500/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] rounded-xl p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">System Audit Engine</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider">
              <th className="pb-3 font-medium">Timestamp</th>
              <th className="pb-2 font-medium">Operator Context</th>
              <th className="pb-2 font-medium">Action</th>
              <th className="pb-2 font-medium">Target Table</th>
              <th className="pb-2 font-medium">Telemetry Mapping</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/30 text-zinc-300 font-mono text-[11px]">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-zinc-600">NO APPLICATION CORE EVENTS REPORTED</td></tr>
            ) : (
              logs.map(l => (
                <tr key={l.id} className="hover:bg-purple-500/[0.02] transition-colors duration-200">
                  <td className="py-3 text-zinc-500">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-3 text-purple-400 font-medium">{l.actor}</td>
                  <td className="py-3">
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/20 text-purple-300 border border-purple-500/10 text-[10px]">{l.action}</span>
                  </td>
                  <td className="py-3 text-zinc-400">{l.target_table}</td>
                  <td className="py-3 text-zinc-500 max-w-xs truncate" title={l.details ?? undefined}>{l.details || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}