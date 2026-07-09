import React from "react";

type Tx = {
  id: string;
  client_name: string;
  type: string;
  amount: number;
  status: string;
  description?: string | null;
};

export default function FinanceLedger({ transactions }: { transactions: Tx[] }) {
  return (
    <div className="bg-[#070510]/40 border border-purple-500/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] rounded-xl p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Accounting Ledger</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800/40 text-[10px] uppercase tracking-wider"><th className="pb-3 font-medium">Handling Reference</th><th className="pb-3 font-medium">Classification</th><th className="pb-3 font-medium">Gross Tally</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Memo Specifications</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/30 text-zinc-300">
            {transactions.length === 0 ? <tr><td colSpan={5} className="py-6 text-center text-zinc-600 font-mono text-[11px]">NO TRANSACTION DATA RECORDED</td></tr> : transactions.map(f => (
              <tr key={f.id} className="hover:bg-purple-500/[0.02] transition-colors duration-300 ease-out">
                <td className="py-3.5 font-medium text-zinc-100">{f.client_name}</td>
                <td className="py-3.5"><span className={`px-2 py-0.5 text-[9px] font-mono border rounded ${f.type === "Invoice" ? "bg-purple-950/20 text-purple-300 border-purple-500/20" : "bg-rose-950/20 text-rose-400 border-rose-500/20"}`}>{f.type.toUpperCase()}</span></td>
                <td className="py-3.5 font-mono font-medium text-zinc-200">₹{f.amount.toLocaleString()}</td>
                <td className="py-3.5"><span className={`px-2 py-0.5 text-[9px] rounded-full font-medium ${f.status === "Paid" || f.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{f.status}</span></td>
                <td className="py-3.5 text-zinc-400 max-w-[200px] truncate">{f.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}