import React from "react";
import { ShieldAlert } from "lucide-react";

interface Props {
  logs: any[];
}

export default function AuditPanel({ logs }: Props) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(15,23,42,0.03)] rounded-xl p-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">System Audit Engine</h3>
        </div>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Live Security Logs</span>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Operator Context</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Target Table</th>
              <th className="pb-3 text-right">Telemetry Mapping</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center font-mono text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50 rounded-xl">
                  No System Audit Logs Registered
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5 font-mono text-slate-400 text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-3.5 text-indigo-600 font-semibold tracking-wide truncate max-w-[150px]">{l.actor}</td>
                  <td className="py-3.5">
                    <span className="inline-block text-[8px] font-bold tracking-widest px-2 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-200 font-mono">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-400 text-[10px]">{l.target_table}</td>
                  <td className="py-3.5 text-right font-medium text-slate-500 max-w-[180px] truncate">{l.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}