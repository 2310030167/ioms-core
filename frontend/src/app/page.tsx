"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogIn, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, UserPlus, Users } from "lucide-react";
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
  const [cf, setCf] = useState<{ id: string; type: "proj" | "task"; name: string } | null>(null);
  const [pf, setPf] = useState({ name: "", status: "New" });
  const [tf, setTf] = useState({ title: "", status: "Todo" });
  const [bp, setBp] = useState<any[]>([]);
  const [rl, setRl] = useState<string>("viewer");
  const [isSu, setIsSu] = useState(false);
  const [us, setUs] = useState<any[]>([]);

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
      const txt = `📊 IOMS CORE EVENT TELEMETRY\n━━━━━━━━━━━━━━\n🔹 Event: ${v}\n👤 Operator: ${au?.email}\n📅 2026-07-06\n━━━━━━━━━━━━━━\n📦 Data Context:\n${msgDetails}`;
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

  const su = async (e: React.FormEvent) => {
    e.preventDefault();
    setEr("");
    const { data, error } = await sb.auth.signUp({ email: fm.email, password: fm.password });
    if (error) {
      setEr(error.message);
      setTs({ msg: "Registration failed.", type: "err" });
    } else {
      setFm({ email: "", password: "" });
      setTs({ msg: "Verification link dispatched to email.", type: "ok" });
      setIsSu(false);
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
    const tbl = cf.type === "proj" ? "projects" : "tasks";
    const { error } = await sb.from(tbl).delete().eq("id", cf.id);
    if (!error) {
      pn(cf.type === "proj" ? "project_purged" : "task_purged", { id: cf.id, name: cf.name });
      setTs({ msg: "Record destroyed.", type: "ok" });
      await gd();
    }
    setCf(null);
  };

  if (!au) {
    return (
      <div className="h-screen w-screen bg-[#06040A] flex items-center justify-center font-sans p-4 selection:bg-[#2C213D]">
        <div className="w-full max-w-sm bg-[#110E1A] border border-[#231C30] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#171324] border border-[#362B4C] flex items-center justify-center text-[#A855F7] mb-4">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">IOMS Cloud Node</h2>
            <p className="text-xs text-[#6A6185] mt-1">{isSu ? "Register Cluster Account" : "Supabase Cluster Authenticator"}</p>
          </div>
          <form onSubmit={isSu ? su : li} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A29DB8] uppercase mb-1.5">Identity Protocol</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6] font-mono" placeholder="name@domain.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A29DB8] uppercase mb-1.5">Access Cipher</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6] font-mono" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-rose-400 font-medium bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5 text-center">{er}</div>}
            <button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-150 active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
              {isSu ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />} {isSu ? "Create Account" : "Authenticate Cloud"}
            </button>
            <button type="button" onClick={() => { setIsSu(!isSu); setEr(""); }} className="w-full text-center text-xs text-[#6A6185] hover:text-[#A29DB8] transition-colors pt-2 block underline underline-offset-4">
              {isSu ? "Already registered? Sign In" : "Request credentials? Sign Up"}
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
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#110E1A] border border-[#231C30] rounded-xl p-4 shadow-2xl flex items-start gap-3">
          {ts.type === "ok" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5" />}
          <div className="flex-1"><h4 className="text-xs font-bold text-white uppercase tracking-wide">System Log</h4><p className="text-xs text-[#A29DB8] mt-1">{ts.msg}</p></div>
        </div>
      )}
      <aside className="w-64 bg-[#110E1A] border-r border-[#231C30] flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2 mb-6"><Activity className="w-6 h-6 text-[#8B5CF6]" /><span className="font-bold text-lg text-white">IOMS Core</span></div>
          <div className="mb-6 p-3 bg-[#171324] border border-[#231C30] rounded-lg">
            <div className="flex items-center gap-2.5 mb-2.5 p-1">
              <div className="w-8 h-8 rounded-lg bg-[#221B38] border border-[#362B4C] flex items-center justify-center text-[#8B5CF6]"><User className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate">{au.email}</p>
                <p className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium text-rose-400 bg-rose-500/5 border border-rose-500/10"><LogOut className="w-3.5 h-3.5" /> Log Out</button>
          </div>
          <nav className="space-y-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => setTb(l.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${tb === l.id ? "bg-[#221B38] text-white border-l-2 border-[#8B5CF6]" : "text-[#A29DB8] hover:bg-[#171324]"}`}>
                <l.icon className="w-4 h-4" />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#110E1A] border-b border-[#231C30] flex items-center justify-between px-8">
          <h1 className="text-sm font-semibold uppercase text-[#A29DB8]">{tb} Console</h1>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span><span className="text-xs font-mono text-[#6A6185]">SUPABASE_CONNECTED</span></div>
        </header>
        <section className="flex-1 overflow-y-auto p-8 bg-[#06040A]">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{ t: "Pipeline Matrix", v: ld ? "..." : st.pipeline }, { t: "Active Tasks", v: ld ? "..." : st.tasks }, { t: "Clearance Level", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-[#110E1A] border border-[#231C30] p-6 rounded-xl"><h3 className="text-xs text-[#6A6185] uppercase">{c.t}</h3><p className="text-3xl font-bold text-white mt-2">{c.v}</p></div>
              ))}
            </div>
            {tb === "dash" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#231C30]/40 pb-3 mb-4"><h3 className="text-xs font-bold text-white uppercase">Workload Engine</h3><div className="text-emerald-400 font-mono text-[10px]">LIVE SYNC OK</div></div>
                  <div className="grid grid-cols-7 gap-4">
                    {Object.entries(tM).map(([stVal, count]) => (
                      <div key={stVal} className="bg-[#09070F] border border-[#231C30] p-3 rounded-lg text-center">
                        <span className="text-[10px] text-[#A29DB8] uppercase truncate block">{stVal}</span>
                        <div className="w-full bg-[#171324] h-16 mt-2 rounded relative flex items-end justify-center"><div style={{ height: `${Math.min(count * 20, 100)}%` }} className="w-3 bg-purple-500 rounded-sm"></div></div>
                        <span className="text-xs font-mono font-bold text-white mt-1 block">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-6">
                  <div className="border-b border-[#231C30]/40 pb-3 mb-4"><h3 className="text-xs font-bold text-white uppercase">Blueprints</h3></div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {bp.length === 0 ? <div className="text-center text-xs text-[#6A6185] py-4">No templates.</div> : bp.map(b => (
                      <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-[#09070F] border border-[#231C30] p-2 rounded flex items-center justify-between ${rl !== "viewer" ? "cursor-pointer" : ""}`}>
                        <span className="text-xs text-white truncate">{b.name}</span>
                        {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-[#6A6185] hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-[#110E1A] border border-[#231C30] rounded-xl p-6">
              {tb === "team" ? (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#231C30]/40">
                    <h2 className="text-sm font-bold text-white uppercase">Cluster Role Configuration</h2>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead><tr className="text-[#6A6185] border-b border-[#231C30]"><th className="pb-2">Operator Identity</th><th className="pb-2 text-right">Clearance Level</th></tr></thead>
                    <tbody>
                      {us.map(u => (
                        <tr key={u.id} className="border-b border-[#231C30]/50 text-white">
                          <td className="py-2.5 font-mono text-xs">{u.email || "Processing handshake..."}</td>
                          <td className="py-2.5 text-right">
                            <select disabled={u.id === au.id} value={u.role} onChange={async (e) => {
                              const v = e.target.value;
                              setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                              await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                              pn("operator_role_updated", { operator: u.email, role: v });
                              await gd();
                            }} className="bg-[#171324] text-xs border border-[#362B4C] px-1.5 py-0.5 rounded text-white disabled:opacity-40">
                              {["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#231C30]/40">
                    <h2 className="text-sm font-bold text-white uppercase">Operational Gateway</h2>
                    {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-[#7C3AED] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Build {tb}</button>}
                  </div>
                  {ld ? <div className="text-center py-6 text-sm text-[#6A6185]">Syncing...</div> : tb === "dash" || tb === "proj" ? (
                    pj.length === 0 ? <div className="text-center py-6 text-xs text-[#6A6185]">No projects records found.</div> : (
                      <table className="w-full text-left text-sm">
                        <thead><tr className="text-[#6A6185] border-b border-[#231C30]"><th className="pb-2">Name</th><th className="pb-2">Status</th>{rl === "admin" && <th className="pb-2 text-right">Kill</th>}</tr></thead>
                        <tbody>
                          {pj.map(p => (
                            <tr key={p.id} className="border-b border-[#231C30]/50 text-white">
                              <td className="py-2.5">{p.name}</td>
                              <td className="py-2.5">
                                <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                  const v = e.target.value;
                                  setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                  await sb.from("projects").update({ status: v }).eq("id", p.id);
                                  pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                  await gd();
                                }} className="bg-[#171324] text-xs border border-[#362B4C] px-1.5 py-0.5 rounded text-white disabled:opacity-50">
                                  {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              {rl === "admin" && <td className="py-2.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-[#6A6185] hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    tk.length === 0 ? <div className="text-center py-6 text-xs text-[#6A6185]">No tasks records found.</div> : (
                      <table className="w-full text-left text-sm">
                        <thead><tr className="text-[#6A6185] border-b border-[#231C30]"><th className="pb-2">Title</th><th className="pb-2">State</th>{rl === "admin" && <th className="pb-2 text-right">Kill</th>}</tr></thead>
                        <tbody>
                          {tk.map(t => (
                            <tr key={t.id} className="border-b border-[#231C30]/50 text-white">
                              <td className="py-2.5">{t.title}</td>
                              <td className="py-2.5">
                                <select disabled={rl === "viewer"} value={t.status} onChange={async (e) => {
                                  const v = e.target.value;
                                  setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                  await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                  pn("task_status_updated", { id: t.id, title: t.title, status: v });
                                  await gd();
                                }} className="bg-[#171324] text-xs border border-[#362B4C] px-1.5 py-0.5 rounded text-white disabled:opacity-50">
                                  {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              {rl === "admin" && <td className="py-2.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-[#6A6185] hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {cf && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#110E1A] border border-rose-500/20 rounded-xl max-w-sm w-full p-6">
            <h3 className="font-bold text-sm text-white uppercase mb-2">Execute Destruction</h3>
            <p className="text-xs text-[#A29DB8]">Purge record "{cf.name}" from database layers?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCf(null)} className="px-3 py-1.5 text-xs bg-[#171324] text-[#A29DB8] rounded-lg">Cancel</button>
              <button onClick={ep} className="px-3 py-1.5 text-xs bg-rose-500 text-white rounded-lg">Destroy</button>
            </div>
          </div>
        </div>
      )}
      {md && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#110E1A] border border-[#231C30] rounded-xl max-w-md w-full overflow-hidden">
            <header className="p-4 border-b border-[#231C30] flex items-center justify-between bg-[#171324]"><h3 className="font-bold text-white text-sm uppercase">Initialize Node</h3><button onClick={() => setMd(null)} className="text-[#565D7A] hover:text-white"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-6 space-y-4">
                <div><label className="block text-xs text-[#A29DB8] uppercase mb-1">Project Name</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" /></div>
                <div><label className="block text-xs text-[#A29DB8] uppercase mb-1">Pipeline State</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => sbp("proj")} className="bg-[#171324] border border-[#362B4C] text-xs text-[#A29DB8] py-2 rounded-lg flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" /> Save Template</button><button type="submit" className="bg-[#7C3AED] text-white text-xs py-2 rounded-lg">Commit</button></div>
              </form>
            ) : (
              <form onSubmit={at} className="p-6 space-y-4">
                <div><label className="block text-xs text-[#A29DB8] uppercase mb-1">Task Title</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]" /></div>
                <div><label className="block text-xs text-[#A29DB8] uppercase mb-1">Task State</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-[#06040A] border border-[#231C30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B5CF6]">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => sbp("task")} className="bg-[#171324] border border-[#362B4C] text-xs text-[#A29DB8] py-2 rounded-lg flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" /> Save Template</button><button type="submit" className="bg-[#7C3AED] text-white text-xs py-2 rounded-lg">Commit</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}