"use client";
import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogIn, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, Users, Menu, Clock, ArrowUpRight, ArrowDownLeft, FileText, BarChart3 } from "lucide-react";
import { sb } from "../lib/sb";

function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const pArr: Array<{ x: number; y: number; r: number; sX: number; sY: number; o: number }> = [];
    const pCount = 40;
    for (let i = 0; i < pCount; i++) {
      pArr.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 1,
        sX: (Math.random() - 0.5) * 0.3,
        sY: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.4 + 0.1
      });
    }
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pArr.forEach((p) => {
        p.x += p.sX;
        p.y += p.sY;
        if (p.x < 0 || p.x > canvas.width) p.sX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.sY *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.o})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#a855f7";
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
}

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
  const [su, setSu] = useState<string | null>(null);

  const lk = [
    { id: "dash", label: "Dashboard", icon: LayoutDashboard },
    { id: "proj", label: "Projects", icon: FolderKanban },
    { id: "task", label: "Tasks", icon: CheckSquare },
    ...(rl === "admin" ? [
      { id: "team", label: "Team Roles", icon: Users },
      { id: "reports", label: "Team Reports", icon: BarChart3 }
    ] : [])
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
          const { data: lData } = await sb.from("user_logins").select("*").order("logged_at", { ascending: false }).limit(200);
          if (lData) setLn(lData);
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
      setTs({ msg: "Login details are incorrect.", type: "err" });
    } else {
      if (data?.user?.email) {
        await sb.from("user_logins").insert([{ email: data.user.email, action: "LOGIN" }]);
      }
      setFm({ email: "", password: "" });
      await gd();
      setTs({ msg: "Successfully logged in.", type: "ok" });
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
    setSu(null);
    setSt({ pipeline: 0, tasks: 0, team: 1 });
    setTs({ msg: "Logged out successfully.", type: "ok" });
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
      setTs({ msg: "New team member account added.", type: "ok" });
      await gd();
    } else {
      setTs({ msg: d.err || "Failed to create account.", type: "err" });
    }
  };

  const ap = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await sb.from("projects").insert([{ name: pf.name, status: pf.status }]).select().single();
    if (!error && data) {
      pn("project_created", data);
      setPf({ name: "", status: "New" });
      setMd(null);
      setTs({ msg: "Project created successfully.", type: "ok" });
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
      setTs({ msg: "Task saved successfully.", type: "ok" });
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
    setTs({ msg: "Template blueprint saved.", type: "ok" });
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
    setTs({ msg: "Template blueprint deleted.", type: "ok" });
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
        setTs({ msg: "User account deleted.", type: "ok" });
        if (su === cf.name) setSu(null);
        await gd();
      } else {
        setTs({ msg: d.err || "Failed to remove user.", type: "err" });
      }
    } else {
      const tbl = cf.type === "proj" ? "projects" : "tasks";
      const { error } = await sb.from(tbl).delete().eq("id", cf.id);
      if (!error) {
        pn(cf.type === "proj" ? "project_purged" : "task_purged", { id: cf.id, name: cf.name });
        setTs({ msg: "Item deleted from database.", type: "ok" });
        await gd();
      }
    }
    setCf(null);
  };

  if (!au) {
    return (
      <div className="min-h-screen w-screen bg-[#000000] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden selection:bg-purple-950/40">
        <div className="absolute top-[-25%] left-[-15%] w-[700px] h-[700px] rounded-full bg-purple-900/5 blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-950/10 blur-[160px] pointer-events-none"></div>
        <div className="w-full max-w-[370px] bg-[#0A0712]/50 border border-zinc-900 rounded-[24px] p-8 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-3.5 shadow-sm">
              <Activity className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-medium tracking-tight text-white">IOMS Hub</h2>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Authentication Node</p>
          </div>
          <form onSubmit={li} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-800/80 transition-colors" placeholder="name@domain.com" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-800/80 transition-colors" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-purple-300 bg-purple-950/20 border border-purple-900/30 rounded-xl p-2 text-center">{er}</div>}
            <button type="submit" className="w-full bg-white hover:bg-zinc-100 text-black text-xs font-semibold py-2.5 rounded-xl tracking-wide mt-2 shadow-sm transition-all active:scale-[0.99]">
              SIGN IN
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (t?.status && tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM]++; });

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-zinc-300 font-sans selection:bg-purple-950 overflow-hidden relative">
      <AmbientCanvas />
      
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-60 bg-[#040406] border-r border-zinc-900 flex flex-col justify-between z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 flex flex-col h-full overflow-y-auto relative z-10">
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-purple-400 stroke-[2]" /><span className="font-semibold text-xs uppercase tracking-wider text-white">IOMS Workspace</span></div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="mb-5 p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-[16px] shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 flex-shrink-0"><User className="w-3 h-3" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-zinc-200 truncate">{au?.email}</p>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-400 bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors"><LogOut className="w-3 h-3" /> Sign Out</button>
          </div>
          <nav className="space-y-1 flex-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${tb === l.id ? "bg-zinc-900 text-white font-semibold shadow-sm" : "text-zinc-500 hover:bg-zinc-900/30 hover:text-zinc-300"}`}>
                <l.icon className={`w-3.5 h-3.5 ${tb === l.id ? "text-purple-400" : "text-zinc-500"}`} />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative z-10">
        <header className="h-14 border-b border-zinc-900/60 flex items-center justify-between px-4 md:px-6 flex-shrink-0 backdrop-blur-md bg-black/20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMo(true)} className="p-1.5 text-zinc-400 hover:text-white lg:hidden rounded-lg bg-zinc-950 border border-zinc-900"><Menu className="w-4 h-4" /></button>
            <h1 className="text-xs font-semibold tracking-wide uppercase text-zinc-400">{tb === "team" ? "Team Roles" : tb === "reports" ? "Individual Reports" : tb} Hub</h1>
          </div>
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse"></span><span className="text-[9px] font-mono text-zinc-600 tracking-widest">ACTIVE</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1000px] mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ t: "Total Projects", v: ld ? "..." : st.pipeline }, { t: "Total Tasks", v: ld ? "..." : st.tasks }, { t: "Account Permission", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-zinc-950/40 border border-zinc-900/80 p-5 rounded-[20px] shadow-sm"><h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{c.t}</h3><p className="text-xl font-semibold text-white mt-1 tracking-tight">{c.v}</p></div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-[20px] p-5 lg:col-span-2 overflow-x-auto shadow-sm">
                  <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-zinc-900/60 min-w-[500px]"><h3 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Task Status Tracker</h3><div className="text-zinc-600 font-mono text-[9px] tracking-widest">REFRESH_OK</div></div>
                  <div className="grid grid-cols-7 gap-2 min-w-[500px]">
                    {Object.entries(tM).map(([stVal, count]) => {
                      const maxVal = Math.max(...Object.values(tM), 1);
                      const barHt = Math.min((count / maxVal) * 100, 100);
                      return (
                        <div key={stVal} className="bg-[#030206]/40 border border-zinc-900/40 px-1 py-3.5 rounded-xl text-center flex flex-col justify-between items-center group hover:border-zinc-800 transition-colors">
                          <span className="text-[9px] font-medium text-zinc-500 uppercase truncate w-full px-0.5 block font-mono">{stVal.replace("_", " ")}</span>
                          <div className="w-1.5 bg-zinc-900/80 h-16 my-3 rounded-full relative flex items-end justify-center overflow-hidden border border-zinc-800/40">
                            <div style={{ height: `${Math.max(barHt, count > 0 ? 10 : 0)}%` }} className="w-full bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-all duration-500 ease-out" />
                          </div>
                          <span className="text-xs font-mono font-medium text-zinc-200 group-hover:text-white transition-colors">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-[20px] p-5 shadow-sm">
                  <div className="pb-3 mb-3 border-b border-zinc-900/60"><h3 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Quick Templates</h3></div>
                  <div className="space-y-1.5 max-h-[148px] overflow-y-auto pr-0.5">
                    {bp.length === 0 ? <div className="text-center text-[11px] font-mono text-zinc-600 py-6">NO CONFIGURATIONS</div> : bp.map(b => (
                      <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-zinc-950/20 border border-zinc-900/60 p-2 rounded-lg flex items-center justify-between gap-2 group transition-colors ${rl !== "viewer" ? "cursor-pointer hover:border-zinc-800" : ""}`}>
                        <span className="text-xs text-zinc-300 truncate font-medium">{b.name}</span>
                        {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-zinc-600 hover:text-zinc-400 p-0.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {tb === "reports" && rl === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-[20px] h-[460px] flex flex-col shadow-sm">
                  <h3 className="text-xs font-medium text-zinc-300 uppercase tracking-wide pb-3 border-b border-zinc-900/60 mb-4 flex-shrink-0">Select Team Member</h3>
                  <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
                    {us.map(u => (
                      <div key={u.id} onClick={() => setSu(u.email)} className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${su === u.email ? "bg-zinc-900 border-zinc-700 text-white shadow-sm" : "bg-zinc-950/40 border-zinc-900/60 text-zinc-400 hover:border-zinc-800"}`}>
                        <p className="text-xs font-medium truncate">{u.email}</p>
                        <p className="text-[9px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">{u.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-[20px] h-[460px] flex flex-col shadow-sm">
                  <h3 className="text-xs font-medium text-zinc-300 uppercase tracking-wide pb-3 border-b border-zinc-900/60 mb-4 flex-shrink-0">Activity Breakdown</h3>
                  {su ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl mb-4 flex-shrink-0 shadow-sm">
                        <p className="text-[10px] uppercase font-medium text-zinc-500">Report Context</p>
                        <p className="text-xs font-semibold text-white truncate mt-1">{su}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-900/60">
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-mono">Assigned Tasks</p>
                            <p className="text-lg font-semibold text-purple-400 mt-0.5">{tk.filter(t => t.assigned_to === su).length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-500 uppercase font-mono">Completed Tasks</p>
                            <p className="text-lg font-semibold text-zinc-300 mt-0.5">{tk.filter(t => t.assigned_to === su && t.status === "Completed").length}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-2 flex-shrink-0">Activity Logs</p>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                        {ln.filter(l => l.email === su).length === 0 ? (
                          <div className="text-center text-[11px] font-mono text-zinc-600 py-6">NO RECORDS FOUND</div>
                        ) : ln.filter(l => l.email === su).map(l => (
                          <div key={l.id} className="bg-zinc-950/30 border border-zinc-900/60 rounded-xl p-2.5 flex items-center justify-between gap-4">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border ${l.action === "LOGIN" ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-zinc-950 text-zinc-500 border-zinc-900"}`}>
                              {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-3" /> : <ArrowUpRight className="w-2.5 h-3" />}
                              {l.action}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500">{new Date(l.logged_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-2xl">
                      <FileText className="w-6 h-6 text-zinc-700 mb-1.5" />
                      <p className="text-xs text-zinc-500 uppercase font-medium tracking-wide">Select a team member to load information logs.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {tb !== "reports" && (
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 md:p-5 overflow-hidden">
                {tb === "team" ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/60">
                        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Team Matrix</h2>
                        {rl === "admin" && <button onClick={() => setMd("user")} className="bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-semibold transition-all"><Plus className="w-3.5 h-3.5" /> Add Team Member</button>}
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Permission Tier</th><th className="pb-2 text-right">Options</th></tr></thead>
                          <tbody className="divide-y divide-zinc-900/40">
                            {us.map(u => (
                              <tr key={u.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3 font-mono text-zinc-200">{u?.email}</td>
                                <td className="py-3">
                                  <select disabled={u?.id === au?.id} value={u?.role} onChange={async (e) => {
                                    const v = e.target.value;
                                    setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                    await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                    pn("operator_role_updated", { operator: u.email, role: v });
                                    await gd();
                                  }} className="bg-zinc-900 text-xs border border-zinc-800 px-2 py-1 rounded-md text-zinc-200 font-mono focus:outline-none focus:border-zinc-700 disabled:opacity-40">
                                    {["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                  </select>
                                </td>
                                <td className="py-3 text-right">
                                  {u?.id !== au?.id ? (
                                    <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-zinc-600 hover:text-zinc-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 font-mono pr-1">YOUR ACCOUNT</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/60">
                        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Recent Logins & Logouts</h2>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Action Status</th><th className="pb-2 text-right">Date & Time</th></tr></thead>
                          <tbody className="divide-y divide-zinc-900/40">
                            {ln.length === 0 ? <tr><td colSpan={3} className="py-4 text-center font-mono text-zinc-600">NO ACTIVITY TRACKED YET</td></tr> : ln.map(l => (
                              <tr key={l.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3 font-mono text-zinc-200">{l.email}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-medium font-mono px-2 py-0.5 rounded-md border ${l.action === "LOGIN" ? "bg-zinc-900 text-zinc-200 border-zinc-800" : "bg-zinc-950 text-zinc-500 border-zinc-900"}`}>
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
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/60">
                      <h2 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Item Configurations</h2>
                      {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-semibold shadow-sm active:scale-[0.98]">
                        <Plus className="w-3.5 h-3.5" /> Create New {tb === "proj" ? "Project" : "Task"}
                      </button>}
                    </div>
                    {ld ? <div className="text-center py-8 font-mono text-zinc-600 animate-pulse tracking-wide text-xs">LOADING DATA ENTRIES...</div> : tb === "dash" || tb === "proj" ? (
                      pj.length === 0 ? <div className="text-center py-8 text-xs text-zinc-600 font-mono">NO PROJECTS FOUND</div> : (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[550px]">
                            <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">Project Name</th><th className="pb-2">Status State</th>{rl === "admin" && <th className="pb-2 text-right">Remove</th>}</tr></thead>
                            <tbody className="divide-y divide-zinc-900/40">
                              {pj.map(p => (
                                <tr key={p.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                  <td className="py-3.5 font-medium text-xs md:text-sm text-zinc-100">{p.name}</td>
                                  <td className="py-3.5">
                                    <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                      const v = e.target.value;
                                      setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                      await sb.from("projects").update({ status: v }).eq("id", p.id);
                                      pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                      await gd();
                                    }} className="bg-zinc-900 text-xs border border-zinc-800 px-2 py-1 rounded-lg text-white focus:outline-none focus:border-purple-800 disabled:opacity-50">
                                      {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-zinc-600 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">Task Title</th><th className="pb-2">Assigned Employee</th><th className="pb-2">Progress Status</th>{rl === "admin" && <th className="pb-2 text-right">Remove</th>}</tr></thead>
                          <tbody className="divide-y divide-zinc-900/40">
                            {tk.map(t => (
                              <tr key={t.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3.5 font-medium text-xs md:text-sm text-zinc-100">{t.title}</td>
                                <td className="py-3.5 font-mono text-xs text-zinc-500">{t.assigned_to || "Unassigned"}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer"} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v, assigned_to: t.assigned_to });
                                    await gd();
                                  }} className="bg-zinc-900 text-xs border border-zinc-800 px-2 py-1 rounded-lg text-white focus:outline-none focus:border-purple-800 disabled:opacity-50">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-zinc-600 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {cf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-medium text-xs text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-purple-400" /> Confirm Deletion</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Are you sure you want to permanently delete <span className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">"{cf.name}"</span> from the system layer?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCf(null)} className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl transition-colors">Cancel</button>
              <button onClick={ep} className="px-3.5 py-1.5 text-xs font-semibold bg-white text-black rounded-xl shadow-sm transition-all active:scale-[0.98]">Delete Item</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <header className="p-3.5 border-b border-zinc-900/60 flex items-center justify-between bg-zinc-900/40"><h3 className="font-bold text-white text-xs uppercase tracking-wider">Create Entry</h3><button onClick={() => setMd(null)} className="text-zinc-500 hover:text-white p-1 rounded-md"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Project Name</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800" placeholder="e.g., Core Storage Deployment" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status State</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2 pt-1"><button type="button" onClick={() => sbp("proj")} className="bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-zinc-800 transition-colors"><Copy className="w-3 h-3" /> Blueprint</button><button type="submit" className="bg-white hover:bg-zinc-100 font-semibold text-black text-[11px] py-2 rounded-xl transition-colors">Commit Entry</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Task Specification</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800" placeholder="e.g., Run Integration Diagnostics" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Execution Phase</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Node Assignment</label><select value={tf.as} onChange={e => setTf({...tf, as: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800"><option value="">Unassigned</option>{us.map(u => <option key={u.id} value={u?.email}>{u?.email}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2 pt-1"><button type="button" onClick={() => sbp("task")} className="bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-zinc-800 transition-colors"><Copy className="w-3 h-3" /> Blueprint</button><button type="submit" className="bg-white hover:bg-zinc-100 font-semibold text-black text-[11px] py-2 rounded-xl transition-colors">Commit Node</button></div>
              </form>
            ) : (
              <form onSubmit={cu} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Identity Handle (Email)</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800" placeholder="operator@enterprise.com" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Access Cipher (Password)</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800" placeholder="••••••••••••" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Clearance Level</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-800">{["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-white hover:bg-zinc-100 font-semibold text-black text-xs py-2.5 rounded-xl transition-colors mt-2">Initialize Profile</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}