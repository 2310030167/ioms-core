import React from "react";
import { Plus, IndianRupee } from "lucide-react";

interface Props {
  transactions: any[];
  onAdd: () => void;
  show: boolean;
}

export default function FinanceLedger({ transactions, onAdd, show }: Props) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(15,23,42,0.03)] rounded-xl p-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-indigo-600" />
          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Accounting Ledger Hub</h3>
        </div>
        {show && (
          <button onClick={onAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/10">
            <Plus className="w-3.5 h-3.5" /> Log Transaction
          </button>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[550px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono">
              <th className="pb-3">Handling Reference</th>
              <th className="pb-3">Classification</th>
              <th className="pb-3">Gross Tally</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Memo Specifications</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center font-mono text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50 rounded-xl">
                  No Accounting Entries Logged
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5 font-semibold text-slate-700 tracking-wide">{t.client_name}</td>
                  <td className="py-3.5">
                    <span className={`inline-block text-[8px] font-bold tracking-widest px-2 py-0.5 rounded border font-mono ${t.type === "Invoice" ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-800 font-bold">₹{parseFloat(t.amount).toLocaleString()}</td>
                  <td className="py-3.5">
                    <span className={`inline-block text-[8px] font-bold tracking-widest px-2 py-0.5 rounded border font-mono ${t.status === "Paid" || t.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-slate-500 font-medium max-w-[150px] truncate">{t.description || "None"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}