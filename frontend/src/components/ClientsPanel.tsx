import React from "react";
import { Plus, Briefcase } from "lucide-react";

interface Props {
  clients: any[];
  onAdd: () => void;
  show: boolean;
}

export default function ClientsPanel({ clients, onAdd, show }: Props) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(15,23,42,0.03)] rounded-xl p-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Client Registry Hub</h3>
        </div>
        {show && (
          <button onClick={onAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/10">
            <Plus className="w-3.5 h-3.5" /> Initialize Client
          </button>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono">
              <th className="pb-3">Client Name</th>
              <th className="pb-3">Corporate Entity</th>
              <th className="pb-3 text-right">Email Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center font-mono text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50 rounded-xl">
                  No Client Records Found
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5 font-semibold text-slate-700 tracking-wide">{c.name}</td>
                  <td className="py-3.5 text-slate-500 font-medium">{c.company || "Individual"}</td>
                  <td className="py-3.5 text-right font-mono text-slate-500 text-[10px]">{c.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}