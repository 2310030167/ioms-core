"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogIn, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, Users, Menu, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
  const [tf, setTf] = useState({ title: "", status: "Todo", as: "" });
  const [uf, setUf] = useState({ em: "", pw: "", rl: "viewer" });
  const [bp, setBp] = useState<any[]>([]);
  const [rl, setRl] = useState<string>("viewer");
  const [us, setUs] = useState<any[]>([]);
  const [ln, setLn] = useState<any[]>([]);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "user_logins" }, () => { if (act) gd(); })
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
          const { data: uData } = await sb.from("user_roles").select("*").order("email", { ascending: true });
          if (uData) {
            setUs(uData);
            setSt(prev => ({ ...prev, team: uData.length }));
          }
          if (rData.role === "admin") {
            const { data: lData } = await sb.from("user_logins").select("*").order("logged_at", { ascending: false }).limit(50);
            if (lData) setLn(lData);
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
        msgDetails = `• ID: ${d.id || ""}\n• Name: ${d.name || d.title || ""}\n• Status/State: ${d.status || ""}\n• Assigned: ${d.assigned_to || "None"}`;
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
      if (data?.user?.email) {
        await sb.from("user_logins").insert([{ email: data.user.email, action: "LOGIN" }]);
      }
      setFm({ email: "", password: "" });
      await gd();
      setTs({ msg: "Session initialized.", type: "ok" });
    }
  };

  const lo = async () => {
    if (au?.email) {
      await sb.from("user_logins").insert([{ email: au.email, action: "LOGOUT" }]);
    }
    await sb.auth.signOut();
    setPj([]);
    setTk([]);
    setUs([]);
    setLn([]);
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
    const { data, error } = await sb.from("tasks").insert([{ title: tf.title, status: tf.status, assigned_to: tf.as || null }]).select().single();
    if (!error && data) {
      pn("task_created", data);
      setTf({ title: "", status: "Todo", as: "" });
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
      setTf({ title: b.name, status: b.status, as: "" });
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

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (t?.status && tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM]++; });

  if (!au) {
    return (
      <div className="min-h-screen w-screen bg-[#07050F] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden selection:bg-purple-950/40">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[140px] pointer-events-none"></div>
        <div className="w-full max-w-[380px] bg-purple-950/10 border border-purple-900/30 rounded-3xl p-8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
              <Activity className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight text-center">IOMS Console</h2>
            <p className="text-[10px] text-purple-400/60 mt-1 font-mono uppercase tracking-widest">Secure Core Authorization</p>
          </div>
          <form onSubmit={li} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Identity</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 font-mono transition-colors" placeholder="operator@enterprise.com" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Access Cipher</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 font-mono transition-colors" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-purple-300 font-mono bg-purple-950/40 border border-purple-900/50 rounded-xl p-2.5 text-center">{er}</div>}
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-3 rounded-xl transition-all active:scale-[0.99] tracking-wide mt-2 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              INITIALIZE NODE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#05040B] text-zinc-300 font-sans selection:bg-purple-950 overflow-hidden relative">
      <div className="absolute top-[-30%] right-[-10%] w-[800px] h-[800px] rounded-full bg-purple-950/10 blur-[160px] pointer-events-none"></div>
      
      {ts && (
        <div className="fixed top-5 right-5 z-50 max-w-xs w-[calc(100vw-2rem)] bg-purple-950/20 border border-purple-900/40 backdrop-blur-md rounded-xl p-3.5 shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-3">
          {ts.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
          <div className="flex-1"><p className="text-xs font-medium text-zinc-200">{ts.msg}</p></div>
        </div>
      )}
      
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-60 bg-[#0A0713]/80 border-r border-purple-950/40 backdrop-blur-xl flex flex-col justify-between z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2.5"><Activity className="w-5 h-5 text-purple-400 stroke-[1.5]" /><span className="font-semibold text-sm text-zinc-100 tracking-tight">IOMS Node</span></div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="mb-4 p-3 bg-purple-950/10 border border-purple-900/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-purple-950 border border-purple-900/40 flex items-center justify-center text-purple-400 flex-shrink-0"><User className="w-3 h-3" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-zinc-200 truncate">{au?.email}</p>
                <p className="text-[9px] font-mono text-purple-400/60 uppercase tracking-wider">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium text-purple-300 bg-purple-950/40 border border-purple-900/30 hover:bg-purple-900/60 hover:text-white transition-colors"><LogOut className="w-3 h-3" /> Terminate</button>
          </div>
          <nav className="space-y-0.5 flex-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tb === l.id ? "bg-purple-950/40 text-purple-300 font-semibold border-l-2 border-purple-500 pl-2.5" : "text-zinc-500 hover:bg-purple-950/10 hover:text-zinc-300"}`}>
                <l.icon className={`w-3.5 h-3.5 ${tb === l.id ? "text-purple-400" : "text-zinc-500"}`} />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden">
        <header className="h-14 border-b border-purple-950/30 flex items-center justify-between px-4 md:px-6 flex-shrink-0 backdrop-blur-md bg-[#05040B]/40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMo(true)} className="p-1.5 text-zinc-400 hover:text-white lg:hidden rounded-lg bg-purple-950/40 border border-purple-900/30"><Menu className="w-4 h-4" /></button>
            <h1 className="text-xs font-medium tracking-wide uppercase text-purple-400/80">{tb} Console</h1>
          </div>
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse"></span><span className="text-[9px] font-mono text-purple-500/40 tracking-widest">ONLINE</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ t: "Pipeline Matrix", v: ld ? "..." : st.pipeline }, { t: "Active Tasks", v: ld ? "..." : st.tasks }, { t: "Clearance Tier", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-purple-950/10 border border-purple-900/20 shadow-sm p-4 rounded-xl backdrop-blur-sm"><h3 className="text-[10px] font-medium text-purple-400/50 uppercase tracking-wider">{c.t}</h3><p className="text-xl font-semibold text-zinc-100 mt-1 tracking-tight">{c.v}</p></div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-purple-950/10 border border-purple-900/20 shadow-sm rounded-xl p-4 md:p-5 lg:col-span-2 overflow-x-auto backdrop-blur-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-900/20 min-w-[500px]"><h3 className="text-xs font-medium text-purple-400/60 uppercase tracking-wider">Metrics Engine</h3><div className="text-purple-500/60 font-mono text-[9px] tracking-widest">SYNC_LIVE</div></div>
                  <div className="grid grid-cols-7 gap-2 min-w-[500px]">
                    {Object.entries(tM).map(([stVal, count]) => (
                      <div key={stVal} className="bg-purple-950/5 border border-purple-900/10 p-2 rounded-xl text-center flex flex-col justify-between">
                        <span className="text-[9px] text-purple-400/50 uppercase truncate font-mono tracking-tighter block">{stVal.replace("_", " ")}</span>
                        <div className="w-full bg-purple-950/10 h-16 mt-2 rounded-md relative flex items-end justify-center overflow-hidden"><div style={{ height: `${Math.min(count * 20, 100)}%` }} className="w-2 md:w-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all duration-500"></div></div>
                        <span className="text-xs font-mono font-bold text-white mt-1.5 block">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-purple-950/10 border border-purple-900/20 shadow-sm rounded-xl p-4 md:p-5 backdrop-blur-sm">
                  <div className="pb-3 mb-3 border-b border-purple-900/20"><h3 className="text-xs font-medium text-purple-400/60 uppercase tracking-wider">Blueprints</h3></div>
                  <div className="space-y-1.5 max-h-[148px] overflow-y-auto pr-0.5">
                    {bp.length === 0 ? <div className="text-center text-[11px] font-mono text-purple-500/40 py-6">NO TEMPLATES</div> : bp.map(b => (
                      <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-purple-950/5 border border-purple-900/10 p-2 rounded-lg flex items-center justify-between gap-2 group transition-colors ${rl !== "viewer" ? "cursor-pointer hover:border-purple-800/60" : ""}`}>
                        <span className="text-xs text-zinc-300 truncate font-medium">{b.name}</span>
                        {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-purple-400/40 hover:text-purple-400 p-0.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-purple-950/10 border border-purple-900/20 shadow-sm rounded-xl p-4 md:p-5 overflow-hidden backdrop-blur-sm">
              {tb === "team" ? (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-900/20">
                      <h2 className="text-xs font-medium text-purple-400/70 uppercase tracking-wider">Clearance Registry</h2>
                      {rl === "admin" && <button onClick={() => setMd("user")} className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all shadow-sm active:scale-[0.98] shadow-purple-950/40"><Plus className="w-3.5 h-3.5" /> Provision Operator</button>}
                    </div>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-mono uppercase tracking-wider"><th className="pb-2 font-medium">Operator</th><th className="pb-2 font-medium">Access Tier</th><th className="pb-2 text-right font-medium">Purge</th></tr></thead>
                        <tbody className="divide-y divide-purple-900/10">
                          {us.map(u => (
                            <tr key={u.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                              <td className="py-3 font-mono text-zinc-200">{u?.email}</td>
                              <td className="py-3">
                                <select disabled={u?.id === au?.id} value={u?.role} onChange={async (e) => {
                                  const v = e.target.value;
                                  setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                  await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                  pn("operator_role_updated", { operator: u.email, role: v });
                                  await gd();
                                }} className="bg-purple-950/40 text-xs border border-purple-900/30 px-2 py-1 rounded-md text-zinc-200 font-mono focus:outline-none focus:border-purple-700 disabled:opacity-40">
                                  {["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                              </td>
                              <td className="py-3 text-right">
                                {u?.id !== au?.id ? (
                                  <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-purple-400/40 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                ) : (
                                  <span className="text-[10px] text-purple-500/30 font-mono pr-1">SELF</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-900/20">
                      <h2 className="text-xs font-medium text-purple-400/70 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400/50" /> Access Telemetry</h2>
                    </div>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-mono uppercase tracking-wider"><th className="pb-2 font-medium">Operator</th><th className="pb-2 font-medium">Event</th><th className="pb-2 text-right font-medium">Timestamp</th></tr></thead>
                        <tbody className="divide-y divide-purple-900/10">
                          {ln.length === 0 ? <tr><td colSpan={3} className="py-4 text-center font-mono text-purple-500/30">NO MATRIX LOGS</td></tr> : ln.map(l => (
                            <tr key={l.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                              <td className="py-3 font-mono text-zinc-200">{l.email}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-medium font-mono px-2 py-0.5 rounded-md border ${l.action === "LOGIN" ? "bg-purple-950 text-purple-300 border-purple-900/40" : "bg-purple-950/20 text-purple-500 border-purple-950"}`}>
                                  {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-3" /> : <ArrowUpRight className="w-2.5 h-3" />}
                                  {l.action}
                                </span>
                              </td>
                              <td className="py-3 text-right font-mono text-zinc-500">{new Date(l.logged_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-900/20">
                    <h2 className="text-xs font-medium text-purple-400/70 uppercase tracking-wider">Gateway Processing</h2>
                    {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all shadow-sm active:scale-[0.98] shadow-purple-950/40"><Plus className="w-3.5 h-3.5" /> Build {tb}</button>}
                  </div>
                  {ld ? <div className="text-center py-8 font-mono text-purple-400/40 animate-pulse tracking-wide text-xs">SYNCHRONIZING REPOSITORY CLUSTER...</div> : tb === "dash" || tb === "proj" ? (
                    pj.length === 0 ? <div className="text-center py-8 text-xs text-purple-400/40 font-mono">NO ACTIVE PROJECT MATRIX FOUND</div> : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-mono uppercase tracking-wider"><th className="pb-2 font-medium">Project Matrix Identifier</th><th className="pb-2 font-medium">Execution Assignment</th>{rl === "admin" && <th className="pb-2 text-right font-medium">Purge</th>}</tr></thead>
                          <tbody className="divide-y divide-purple-900/10">
                            {pj.map(p => (
                              <tr key={p.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                                <td className="py-3 font-medium text-zinc-100">{p.name}</td>
                                <td className="py-3">
                                  <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                    await sb.from("projects").update({ status: v }).eq("id", p.id);
                                    pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                    await gd();
                                  }} className="bg-purple-950/40 text-xs border border-purple-900/30 px-2 py-1 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-700 disabled:opacity-50">
                                    {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-purple-400/40 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    tk.length === 0 ? <div className="text-center py-8 text-xs text-purple-400/40 font-mono">NO ACTIVE TASK RECORDS FOUND</div> : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-mono uppercase tracking-wider"><th className="pb-2 font-medium">Task Matrix Specification</th><th className="pb-2 font-medium">Assigned Operator</th><th className="pb-2 font-medium">Operational State</th>{rl === "admin" && <th className="pb-2 text-right font-medium">Purge</th>}</tr></thead>
                          <tbody className="divide-y divide-purple-900/10">
                            {tk.map(t => (
                              <tr key={t.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                                <td className="py-3 font-medium text-zinc-100">{t.title}</td>
                                <td className="py-3 font-mono text-zinc-400">{t.assigned_to || "Unassigned"}</td>
                                <td className="py-3">
                                  <select disabled={rl === "viewer" && t.assigned_to !== au?.email} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v, assigned_to: t.assigned_to });
                                    await gd();
                                  }} className="bg-purple-950/40 text-xs border border-purple-900/30 px-2 py-1 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-700 disabled:opacity-50">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-purple-400/40 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D0A16] border border-purple-900/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-medium text-xs text-zinc-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-purple-400" /> Confirm Destruction</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Confirm absolute deletion of entry <span className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-900/30">"{cf.name}"</span> from cloud cluster registries?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCf(null)} className="px-3.5 py-1.5 text-xs font-semibold bg-purple-950/40 border border-purple-900/30 hover:bg-purple-900/60 text-zinc-300 rounded-xl transition-colors">Abort</button>
              <button onClick={ep} className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors">Purge Node</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D0A16] border border-purple-900/40 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <header className="p-3.5 border-b border-purple-900/20 flex items-center justify-between bg-purple-950/10"><h3 className="font-semibold text-zinc-100 text-xs uppercase tracking-wider">Initialize Pipeline Entry</h3><button onClick={() => setMd(null)} className="text-zinc-500 hover:text-white p-0.5 rounded-md"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Structural Handle</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-600" placeholder="e.g., Core Storage Deployment" /></div>
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Execution Assignment</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2 pt-1"><button type="button" onClick={() => sbp("proj")} className="bg-purple-950/40 border border-purple-900/30 text-[11px] font-medium text-purple-300 py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-purple-900/60 transition-colors"><Copy className="w-3 h-3" /> Blueprint</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 font-semibold text-white text-[11px] py-2 rounded-xl transition-colors">Commit Entry</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Task Specification</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-600" placeholder="e.g., Run Integration Diagnostics" /></div>
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Execution Phase</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Target Node Assignment</label><select value={tf.as} onChange={e => setTf({...tf, as: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"><option value="">Unassigned</option>{us.map(u => <option key={u.id} value={u?.email}>{u?.email}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2 pt-1"><button type="button" onClick={() => sbp("task")} className="bg-purple-950/40 border border-purple-900/30 text-[11px] font-medium text-purple-300 py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-purple-900/60 transition-colors"><Copy className="w-3 h-3" /> Blueprint</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 font-semibold text-white text-[11px] py-2 rounded-xl transition-colors">Commit Node</button></div>
              </form>
            ) : (
              <form onSubmit={cu} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Identity Handle (Email)</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-600" placeholder="operator@enterprise.com" /></div>
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Access Cipher (Password)</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-600" placeholder="••••••••••••" /></div>
                <div><label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Clearance Level</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600">{["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-semibold text-white text-xs py-2.5 rounded-xl transition-colors mt-2">Initialize Profile</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}