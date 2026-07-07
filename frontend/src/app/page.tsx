"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogIn, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, Users, Menu } from "lucide-react";
import { sb } from "../lib/sb";

export default function Home() {
  const [au, setAu] = useState<any>(null);
  const [fm, setFm] = useState({ email: "", password: "" });
  const [er, setEr] = useState("");
  const [tb, setTb] = useState("dash");
  const [st, setSt] = useState({ pipeline: 0, tasks: 0, team: 1 });
  const [pj, setPj] = useState<any[]>([]);
  const [tk, setTk] = useState<any[]>([]);
  const [ld, setLd] = useState(true);
  const [md, setMd] = useState<string | null>(null);
  const [ts, setTs] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [cf, setCf] = useState<{ id: string; type: "proj" | "task" | "user"; name: string } | null>(null);
  const [pf, setPf] = useState({ name: "", status: "New" });
  const [tf, setTf] = useState({ title: "", status: "Todo" });
  const [uf, setUf] = useState({ em: "", pw: "", rl: "viewer" });
  const [bp, setBp] = useState<any[]>([]);
  const [rl, setRl] = useState<string>("viewer");
  const [us, setUs] = useState<any[]>([]);
  const [mo, setMo] = useState(false);

  const lk = [
    { id: "dash", label: "Dashboard", icon: LayoutDashboard },
    { id: "proj", label: "Projects", icon: FolderKanban },
    { id: "task", label: "Tasks", icon: CheckSquare },
    ...(rl === "admin" ? [{ id: "team", label: "Team Roles", icon: Users }] : [])
  ];

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setAu(session?.user ?? null);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAu(session?.user ?? null);
    });
    const s = localStorage.getItem("ioms_blueprints");
    if (s) setBp(JSON.parse(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!au?.id) return;
    gd();
    let act = true;
    const ch = sb.channel("db-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => { if (act) gd(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => { if (act) gd(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => { if (act) gd(); })
      .subscribe();
    return () => {
      act = false;
      sb.removeChannel(ch);
    };
  }, [au?.id]);

  useEffect(() => {
    if (ts) {
      const t = setTimeout(() => setTs(null), 4000);
      return () => clearTimeout(t);
    }
  }, [ts]);

  async function gd() {
    if (!sb.auth.getUser()) return;
    try {
      const { data: pData } = await sb.from("projects").select("*").order("created_at", { ascending: false });
      const { data: tData } = await sb.from("tasks").select("*").order("created_at", { ascending: false });
      const { data: sessionData } = await sb.auth.getSession();
      const uId = sessionData.session?.user?.id;
      
      if (uId) {
        const { data: rData } = await sb.from("user_roles").select("role").eq("id", uId).maybeSingle();
        if (rData) {
          setRl(rData.role);
          if (rData.role === "admin") {
            const { data: uData } = await sb.from("user_roles").select("*").order("email", { ascending: true });
            if (uData) {
              setUs(uData);
              setSt(prev => ({ ...prev, team: uData.length }));
            }
          }
        }
      }
      
      const pL = pData || [];
      const tL = tData || [];
      setSt(prev => ({ ...prev, pipeline: pL.length, tasks: tL.length }));
      setPj(pL);
      setTk(tL);
    } catch (e) {} finally {
      setLd(false);
    }
  }

  const pn = async (v: string, d: any) => {
    try {
      const tok = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
      const cid = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
      if (!tok || !cid) return;
      let msgDetails = "";
      if (v === "operator_role_updated") {
        msgDetails = `• Target: ${d.operator}\n• New Role: ${d.role}`;
      } else {
        msgDetails = `• ID: ${d.id || ""}\n• Name: ${d.name || d.title || ""}\n• Status/State: ${d.status || ""}`;
      }
      const txt = `📊 IOMS CORE EVENT TELEMETRY\n━━━━━━━━━━━━━━\n🔹 Event: ${v}\n👤 Operator: ${au?.email}\n📅 2026-07-07\n━━━━━━━━━━━━━━\n📦 Data Context:\n${msgDetails}`;
      fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: cid, text: txt })
      }).catch(() => {});
    } catch (e) {}
  };

  const li = async (e: React.FormEvent) => {
    e.preventDefault();
    setEr("");
    const { data, error } = await sb.auth.signInWithPassword({ email: fm.email, password: fm.password });
    if (error) {
      setEr(error.message);
      setTs({ msg: "Validation failure.", type: "err" });
    } else {
      setFm({ email: "", password: "" });
      await gd();
      setTs({ msg: "Session initialized.", type: "ok" });
    }
  };

  const lo = async () => {
    await sb.auth.signOut();
    setPj([]);
    setTk([]);
    setUs([]);
    setRl("viewer");
    setTb("dash");
    setSt({ pipeline: 0, tasks: 0, team: 1 });
    setTs({ msg: "Session terminated.", type: "ok" });
    setMo(false);
  };

  const cu = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uf)
    });
    const d = await res.json();
    if (d.ok) {
      pn("operator_provisioned", { id: "SYSTEM", name: uf.em, status: uf.rl });
      setUf({ em: "", pw: "", rl: "viewer" });
      setMd(null);
      setTs({ msg: "Identity provisioned.", type: "ok" });
      await gd();
    } else {
      setTs({ msg: d.err || "Provisioning error.", type: "err" });
    }
  };

  const ap = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await sb.from("projects").insert([{ name: pf.name, status: pf.status }]).select().single();
    if (!error && data) {
      pn("project_created", data);
      setPf({ name: "", status: "New" });
      setMd(null);
      setTs({ msg: "Project committed.", type: "ok" });
      await gd();
    }
  };

  const at = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await sb.from("tasks").insert([{ title: tf.title, status: tf.status }]).select().single();
    if (!error && data) {
      pn("task_created", data);
      setTf({ title: "", status: "Todo" });
      setMd(null);
      setTs({ msg: "Task written.", type: "ok" });
      await gd();
    }
  };

  const sbp = (t: "proj" | "task") => {
    const n = t === "proj" ? pf.name : tf.title;
    const s = t === "proj" ? pf.status : tf.status;
    if (!n.trim()) return;
    const i = { id: Math.random().toString(36).substr(2, 9), type: t, name: n, status: s };
    const u = [...bp, i];
    setBp(u);
    localStorage.setItem("ioms_blueprints", JSON.stringify(u));
    setMd(null);
    setTs({ msg: "Template saved.", type: "ok" });
  };

  const abp = (b: any) => {
    if (b.type === "proj") {
      setPf({ name: b.name, status: b.status });
      setMd("proj");
    } else {
      setTf({ title: b.name, status: b.status });
      setMd("task");
    }
  };

  const dbp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const u = bp.filter(x => x.id !== id);
    setBp(u);
    localStorage.setItem("ioms_blueprints", JSON.stringify(u));
    setTs({ msg: "Template purged.", type: "ok" });
  };

  const ep = async () => {
    if (!cf) return;
    if (cf.type === "user") {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cf.id })
      });
      const d = await res.json();
      if (d.ok) {
        pn("operator_purged", { id: cf.id, name: cf.name });
        setTs({ msg: "Operator matrix dropped.", type: "ok" });
        await gd();
      } else {
        setTs({ msg: d.err || "Purge error.", type: "err" });
      }
    } else {
      const tbl = cf.type === "proj" ? "projects" : "tasks";
      const { error } = await sb.from(tbl).delete().eq("id", cf.id);
      if (!error) {
        pn(cf.type === "proj" ? "project_purged" : "task_purged", { id: cf.id, name: cf.name });
        setTs({ msg: "Record destroyed.", type: "ok" });
        await gd();
      }
    }
    setCf(null);
  };

  if (!au) {
    return (
      <div className="min-h-screen w-screen bg-[#06040A] flex flex-col items-center justify-center font-sans p-4 selection:bg-[#2C213D] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#140E24_1px,transparent_1px),linear-gradient(to_bottom,#140E24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="w-full max-w-md bg-[#110E1A] border border-[#231C30] rounded-2xl p-6 md:p-10 shadow-2xl relative z-10 transition-all">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#171324] border border-[#362B4C] flex items-center justify-center text-[#A855F7] mb-4 shadow-inner">
              <Activity className="w-7 h-7 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wider text-center">IOMS PLATFORM NODE</h2>
            <p className="text-xs text-[#7C749B] mt-1.5 font-mono uppercase tracking-widest">Secure Gateway Authorization</p>
          </div>
          <form onSubmit={li} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-2">Identity Protocol</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] font-mono transition-all" placeholder="operator@enterprise.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-2">Access Cipher</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] font-mono transition-all" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-rose-400 font-mono bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-center">{er}</div>}
            <button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold py-3.5 rounded-xl transition-all duration-150 active:scale-[0.99] shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> INITIALIZE CONSOLE
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM]++; });

  return (
    <div className="flex h-screen w-screen bg-[#09070F] text-[#E4E6ED] font-sans selection:bg-[#2C213D] overflow-hidden relative">
      {ts && (
        <div className="fixed top-4 md:top-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-[#110E1A] border border-[#231C30] rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          {ts.type === "ok" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />}
          <div className="flex-1"><h4 className="text-xs font-bold text-white uppercase tracking-wide">System Log</h4><p className="text-xs text-[#A29DB8] mt-1">{ts.msg}</p></div>
        </div>
      )}
      
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#110E1A] border-r border-[#231C30] flex flex-col justify-between z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3"><Activity className="w-6 h-6 text-[#8B5CF6]" /><span className="font-extrabold text-lg text-white tracking-wider">IOMS Core</span></div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-[#6A6185] hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="mb-6 p-3 bg-[#171324] border border-[#231C30] rounded-xl">
            <div className="flex items-center gap-2.5 mb-3 p-1">
              <div className="w-8 h-8 rounded-lg bg-[#221B38] border border-[#362B4C] flex items-center justify-center text-[#8B5CF6] flex-shrink-0"><User className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate">{au.email}</p>
                <p className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors"><LogOut className="w-3.5 h-3.5" /> Log Out</button>
          </div>
          <nav className="space-y-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tb === l.id ? "bg-[#221B38] text-white shadow-inner" : "text-[#A29DB8] hover:bg-[#171324] hover:text-white"}`}>
                <l.icon className={`w-4 h-4 ${tb === l.id ? "text-[#8B5CF6]" : ""}`} />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#110E1A] border-b border-[#231C30] flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMo(true)} className="p-2 text-[#A29DB8] hover:text-white lg:hidden rounded-lg bg-[#171324] border border-[#231C30]"><Menu className="w-4 h-4" /></button>
            <h1 className="text-xs md:text-sm font-bold tracking-wider uppercase text-[#A29DB8]">{tb} Console</h1>
          </div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span><span className="text-[10px] md:text-xs font-mono text-[#6A6185] tracking-widest">CLUSTER_ONLINE</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#06040A]">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[{ t: "Pipeline Matrix", v: ld ? "..." : st.pipeline }, { t: "Active Tasks", v: ld ? "..." : st.tasks }, { t: "Clearance Level", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-[#110E1A] border border-[#231C30] p-5 md:p-6 rounded-xl shadow-sm"><h3 className="text-[10px] md:text-xs font-bold text-[#6A6185] uppercase tracking-wider">{c.t}</h3><p className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">{c.v}</p></div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-4 md:p-6 lg:col-span-2 overflow-x-auto">
                  <div className="flex items-center justify-between border-b border-[#231C30]/40 pb-3 mb-4 min-w-[500px]"><h3 className="text-xs font-bold text-white uppercase tracking-wider">Workload Engine</h3><div className="text-emerald-400 font-mono text-[9px] tracking-widest">REALTIME_SYNC_OK</div></div>
                  <div className="grid grid-cols-7 gap-2 md:gap-4 min-w-[500px]">
                    {Object.entries(tM).map(([stVal, count]) => (
                      <div key={stVal} className="bg-[#09070F] border border-[#231C30] p-2 md:p-3 rounded-xl text-center flex flex-col justify-between">
                        <span className="text-[9px] text-[#A29DB8] uppercase truncate font-mono tracking-tighter block">{stVal.replace("_", " ")}</span>
                        <div className="w-full bg-[#171324] h-20 mt-2 rounded-lg relative flex items-end justify-center overflow-hidden"><div style={{ height: `${Math.min(count * 20, 100)}%` }} className="w-2 md:w-3 bg-gradient-to-t from-[#6D28D9] to-[#8B5CF6] rounded-t-sm transition-all duration-500"></div></div>
                        <span className="text-xs font-mono font-bold text-white mt-1.5 block">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-4 md:p-6">
                  <div className="border-b border-[#231C30]/40 pb-3 mb-4"><h3 className="text-xs font-bold text-white uppercase tracking-wider">Blueprints</h3></div>
                  <div className="space-y-2 max-h-[176px] overflow-y-auto pr-1">
                    {bp.length === 0 ? <div className="text-center text-xs text-[#6A6185] py-6 font-mono">NO TEMPLATES CONFIGURED</div> : bp.map(b => (
                      <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-[#09070F] border border-[#231C30] p-2.5 rounded-xl flex items-center justify-between gap-2 group transition-all ${rl !== "viewer" ? "cursor-pointer hover:border-[#362B4C]" : ""}`}>
                        <span className="text-xs text-white truncate font-medium">{b.name}</span>
                        {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-[#6A6185] hover:text-rose-400 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-4 md:p-6 overflow-hidden">
              {tb === "team" ? (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#231C30]/40">
                    <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">Cluster Role Configuration</h2>
                    {rl === "admin" && <button onClick={() => setMd("user")} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 font-semibold shadow-md active:scale-[0.98] transition-all"><Plus className="w-4 h-4" /> Provision Operator</button>}
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[500px]">
                      <thead><tr className="text-[#6A6185] border-b border-[#231C30] text-xs font-mono uppercase tracking-wider"><th className="pb-3 font-semibold">Operator Identity</th><th className="pb-3 font-semibold">Clearance Level</th><th className="pb-3 text-right font-semibold">Purge</th></tr></thead>
                      <tbody className="divide-y divide-[#231C30]/40">
                        {us.map(u => (
                          <tr key={u.id} className="text-white hover:bg-[#171324]/30 transition-colors">
                            <td className="py-3.5 font-mono text-xs">{u.email}</td>
                            <td className="py-3.5">
                              <select disabled={u.id === au?.id} value={u.role} onChange={async (e) => {
                                const v = e.target.value;
                                setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                pn("operator_role_updated", { operator: u.email, role: v });
                                await gd();
                              }} className="bg-[#171324] text-xs border border-[#362B4C] px-2.5 py-1.5 rounded-lg text-white font-mono focus:outline-none focus:border-[#8B5CF6] disabled:opacity-40">
                                {["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                              </select>
                            </td>
                            <td className="py-3.5 text-right">
                              {u.id !== au?.id ? (
                                <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-[#6A6185] hover:text-rose-400 p-1.5 rounded transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-[#6A6185] font-mono pr-2">SELF</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#231C30]/40">
                    <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">Operational Gateway</h2>
                    {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 font-semibold shadow-md active:scale-[0.98] transition-all"><Plus className="w-4 h-4" /> Build {tb}</button>}
                  </div>
                  {ld ? <div className="text-center py-10 text-xs font-mono text-[#6A6185] tracking-widest animate-pulse">SYNCHRONIZING REPOSITORY CLUSTER...</div> : tb === "dash" || tb === "proj" ? (
                    pj.length === 0 ? <div className="text-center py-10 text-xs text-[#6A6185] font-mono">NO ACTIVE PROJECT RECORDS FOUND</div> : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[550px]">
                          <thead><tr className="text-[#6A6185] border-b border-[#231C30] text-xs font-mono uppercase tracking-wider"><th className="pb-3 font-semibold">Project Identifier Matrix</th><th className="pb-3 font-semibold">Operational Status</th>{rl === "admin" && <th className="pb-3 text-right font-semibold">Purge</th>}</tr></thead>
                          <tbody className="divide-y divide-[#231C30]/40">
                            {pj.map(p => (
                              <tr key={p.id} className="text-white hover:bg-[#171324]/30 transition-colors">
                                <td className="py-3.5 font-medium text-xs md:text-sm">{p.name}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                    await sb.from("projects").update({ status: v }).eq("id", p.id);
                                    pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                    await gd();
                                  }} className="bg-[#171324] text-xs border border-[#362B4C] px-2 py-1 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50">
                                    {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-[#6A6185] hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    tk.length === 0 ? <div className="text-center py-10 text-xs text-[#6A6185] font-mono">NO ACTIVE TASK RECORDS FOUND</div> : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[550px]">
                          <thead><tr className="text-[#6A6185] border-b border-[#231C30] text-xs font-mono uppercase tracking-wider"><th className="pb-3 font-semibold">Task Registry Description</th><th className="pb-3 font-semibold">Operational State</th>{rl === "admin" && <th className="pb-3 text-right font-semibold">Purge</th>}</tr></thead>
                          <tbody className="divide-y divide-[#231C30]/40">
                            {tk.map(t => (
                              <tr key={t.id} className="text-white hover:bg-[#171324]/30 transition-colors">
                                <td className="py-3.5 font-medium text-xs md:text-sm">{t.title}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer"} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v });
                                    await gd();
                                  }} className="bg-[#171324] text-xs border border-[#362B4C] px-2 py-1 rounded-lg text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-[#6A6185] hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      {cf && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#110E1A] border border-rose-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /> Execute Destruction</h3>
            <p className="text-xs text-[#A29DB8] leading-relaxed">Confirm permanent deletion of protocol entry <span className="text-white font-mono bg-[#06040A] px-1 py-0.5 rounded border border-[#231C30]">"{cf.name}"</span> from active database matrix layers?</p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button onClick={() => setCf(null)} className="px-4 py-2 text-xs font-semibold bg-[#171324] border border-[#231C30] hover:bg-[#231C30] text-[#A29DB8] rounded-xl transition-colors">Abort</button>
              <button onClick={ep} className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-900/20 transition-colors">Destroy Node</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#110E1A] border border-[#231C30] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <header className="p-4 border-b border-[#231C30] flex items-center justify-between bg-[#171324]"><h3 className="font-bold text-white text-sm uppercase tracking-wider">Initialize Node Pipeline</h3><button onClick={() => setMd(null)} className="text-[#565D7A] hover:text-white p-1 rounded-lg"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-6 space-y-4">
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Project Structural Name</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" placeholder="e.g., Enterprise Database Migration" /></div>
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Pipeline State Assignment</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("proj")} className="bg-[#171324] border border-[#362B4C] text-xs font-semibold text-[#A29DB8] py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#231C30] transition-colors"><Copy className="w-3.5 h-3.5" /> Save Template</button><button type="submit" className="bg-[#7C3AED] hover:bg-[#6D28D9] font-semibold text-white text-xs py-2.5 rounded-xl transition-colors shadow-md">Commit Cluster</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-6 space-y-4">
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Task Operational Title</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" placeholder="e.g., Run System Integration Sweep" /></div>
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Task Execution State</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("task")} className="bg-[#171324] border border-[#362B4C] text-xs font-semibold text-[#A29DB8] py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#231C30] transition-colors"><Copy className="w-3.5 h-3.5" /> Save Template</button><button type="submit" className="bg-[#7C3AED] hover:bg-[#6D28D9] font-semibold text-white text-xs py-2.5 rounded-xl transition-colors shadow-md">Commit Node</button></div>
              </form>
            ) : (
              <form onSubmit={cu} className="p-6 space-y-4">
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Identity Protocol (Email)</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" placeholder="operator@enterprise.com" /></div>
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Access Cipher (Password)</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" placeholder="••••••••••••" /></div>
                <div><label className="block text-[11px] font-bold text-[#A29DB8] uppercase tracking-wider mb-1.5">Clearance Level</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8B5CF6]">{["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] font-semibold text-white text-xs py-3 rounded-xl transition-colors shadow-md mt-2">Initialize Profile Node</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}