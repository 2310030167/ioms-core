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
    <div className="bg-purple-955/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
        <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Accounting Statements</h2>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">Account Handling</th><th className="pb-2">Classification</th><th className="pb-2">Gross Tally</th><th className="pb-2">Status</th><th className="pb-2">Details</th></tr>
          </thead>
          <tbody className="divide-y divide-purple-900/10">
            {transactions.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-purple-500/40 font-mono">NO TRANSFERS AUDITED YET</td></tr> : transactions.map(f => (
              <tr key={f.id} className="text-zinc-300 hover:bg-purple-955/5 transition-colors">
                <td className="py-3 font-semibold text-white">{f.client_name}</td>
                <td className="py-3"><span className={`px-2 py-0.5 text-[10px] rounded border font-mono font-bold ${f.type === "Invoice" ? "bg-purple-950 text-purple-300 border-purple-800/40" : f.type === "Expense" ? "bg-rose-950/40 text-rose-400 border-rose-900/30" : "bg-zinc-900 text-zinc-400 border-zinc-800"}`}>{f.type.toUpperCase()}</span></td>
                <td className="py-3 font-mono font-bold text-zinc-100">₹{f.amount.toLocaleString()}</td>
                <td className="py-3"><span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${f.status === "Paid" || f.status === "Approved" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"}`}>{f.status}</span></td>
                <td className="py-3 truncate max-w-[150px] text-zinc-400">{f.description || "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}