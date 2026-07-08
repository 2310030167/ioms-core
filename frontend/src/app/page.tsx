"use client";
import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogIn, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, Users, Menu, Clock, ArrowUpRight, ArrowDownLeft, FileText, BarChart3, ClipboardCheck } from "lucide-react";
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
    const pCount = 50;
    for (let i = 0; i < pCount; i++) {
      pArr.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        sX: (Math.random() - 0.5) * 0.4,
        sY: (Math.random() - 0.5) * 0.4,
        o: Math.random() * 0.5 + 0.2
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
        ctx.shadowBlur = 8;
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
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-60" />;
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
  const [lf, setLf] = useState({ cp: "", bl: "", pl: "", hr: "" });
  const [bp, setBp] = useState<any[]>([]);
  const [rl, setRl] = useState<string>("viewer");
  const [us, setUs] = useState<any[]>([]);
  const [ln, setLn] = useState<any[]>([]);
  const [wl, setWl] = useState<any[]>([]);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "work_logs" }, () => { if (act) gd(); })
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
          const { data: wData } = await sb.from("work_logs").select("*").order("created_at", { ascending: false });
          if (wData) setWl(wData);
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
    setWl([]);
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

  const sl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!au?.email) return;
    const { error } = await sb.from("work_logs").insert([{
      email: au.email,
      completed: lf.cp,
      blockers: lf.bl || "None",
      plan: lf.pl,
      hours: parseFloat(lf.hr)
    }]);
    if (!error) {
      setLf({ cp: "", bl: "", pl: "", hr: "" });
      setTs({ msg: "Daily work log submitted successfully.", type: "ok" });
      await gd();
    } else {
      setTs({ msg: "Failed to submit work log.", type: "err" });
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

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (t?.status && tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM]++; });

  return (
    <div className="flex h-screen w-screen bg-[#050409] text-zinc-300 font-sans selection:bg-purple-950 overflow-hidden relative">
      <AmbientCanvas />
      
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0A0713]/90 border-r border-purple-955/50 backdrop-blur-xl flex flex-col justify-between z-40 transition-transform duration-300 lg:static lg:translate-x-0 shadow-[4px_0_30px_rgba(0,0,0,0.5)] ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 overflow-y-auto flex-1 relative z-10">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2.5"><Activity className="w-5 h-5 text-purple-400 stroke-[1.5]" /><span className="font-extrabold text-sm text-zinc-100 tracking-tight">IOMS Central</span></div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="mb-4 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] border-b-2 border-purple-955/60">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-md bg-purple-950 border border-purple-900/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-inner"><User className="w-3 h-3" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-zinc-200 truncate">{au?.email}</p>
                <p className="text-[9px] font-mono text-purple-400/70 font-bold uppercase tracking-wider">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-purple-300 bg-purple-950/30 border border-purple-900/40 hover:bg-purple-900/50 hover:text-white border-b-2 border-purple-950 active:border-b-0 active:translate-y-px transition-all"><LogOut className="w-3 h-3" /> Sign Out</button>
          </div>
          <nav className="space-y-1 flex-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${tb === l.id ? "bg-purple-950/30 text-purple-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-purple-900/20" : "text-zinc-500 hover:bg-purple-950/10 hover:text-zinc-300"}`}>
                <l.icon className={`w-3.5 h-3.5 ${tb === l.id ? "text-purple-400" : "text-zinc-500"}`} handle="" />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative z-10">
        <header className="h-14 border-b border-purple-955/30 flex items-center justify-between px-4 md:px-6 flex-shrink-0 backdrop-blur-md bg-[#05040B]/40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMo(true)} className="p-1.5 text-zinc-400 hover:text-white lg:hidden rounded-lg bg-purple-955/40 border border-purple-900/30"><Menu className="w-4 h-4" /></button>
            <h1 className="text-xs font-bold tracking-wide uppercase text-purple-400/80">
              {tb === "team" ? "Team Roles" : tb === "reports" ? "Individual Reports" : tb} Hub
            </h1>
          </div>
          <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse"></span><span className="text-[9px] font-mono text-purple-500/40 tracking-widest">SYSTEM ACTIVE</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ t: "Total Projects", v: ld ? "..." : st.pipeline }, { t: "Total Tasks", v: ld ? "..." : st.tasks }, { t: "Your Account Role", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.03)] border-b-[5px] border-purple-955/60 p-4 rounded-2xl backdrop-blur-sm transform hover:translate-y-[-2px] transition-all duration-200"><h3 className="text-[10px] font-bold text-purple-400/40 uppercase tracking-wider">{c.t}</h3><p className="text-2xl font-black text-zinc-100 mt-1 tracking-tight">{c.v}</p></div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-4 md:p-6 lg:col-span-2 overflow-x-auto backdrop-blur-sm">
                    <div className="flex items-center justify-between pb-3 mb-5 border-b border-purple-900/20 min-w-[500px]"><h3 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Task Status Tracker</h3><div className="text-purple-500/60 font-mono text-[9px] tracking-widest">DATA_REFRESH_OK</div></div>
                    <div className="grid grid-cols-7 gap-3 min-w-[500px]">
                      {Object.entries(tM).map(([stVal, count]) => {
                        const maxTasks = Math.max(...Object.values(tM), 1);
                        const pct = Math.min((count / maxTasks) * 100, 100);
                        return (
                          <div key={stVal} className="bg-purple-950/5 border border-purple-900/10 p-2.5 rounded-xl text-center flex flex-col justify-between items-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] border-b-[3px] border-purple-950/80 hover:scale-[1.03] hover:border-purple-500/30 transition-all duration-200 group">
                            <span className="text-[9px] font-bold tracking-wide text-purple-300/70 group-hover:text-purple-300 uppercase truncate w-full transition-colors font-mono">{stVal.replace("_", " ")}</span>
                            <div className="w-3.5 bg-purple-950/40 h-28 my-3 rounded-full relative flex items-end justify-center overflow-hidden shadow-[inset_0_2px_5px_rgba(0,0,0,0.7)] border border-purple-900/20">
                              <div style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} className="w-full bg-gradient-to-t from-purple-700 via-purple-500 to-fuchsia-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(168,85,247,0.6)] relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 rounded-full blur-[1px]"></div>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-white mt-1.5 block">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12_30px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <div className="pb-3 mb-3 border-b border-purple-900/20"><h3 className="text-xs font-bold text-purple-400/60 uppercase tracking-wider">Quick Templates</h3></div>
                    <div className="space-y-1.5 max-h-[168px] overflow-y-auto pr-0.5">
                      {bp.length === 0 ? <div className="text-center text-[11px] font-mono text-purple-500/40 py-6">NO TEMPLATES CONFIGURED</div> : bp.map(b => (
                        <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-purple-950/5 border border-purple-900/10 p-2 rounded-xl flex items-center justify-between gap-2 group transition-colors shadow-sm ${rl !== "viewer" ? "cursor-pointer hover:border-purple-800/60" : ""}`}>
                          <span className="text-xs text-zinc-300 truncate font-semibold">{b.name}</span>
                          {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-purple-400/40 hover:text-purple-400 p-0.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {rl !== "admin" && (
                  <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-purple-900/20">
                      <ClipboardCheck className="w-4 h-4 text-purple-400" />
                      <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Mandatory Daily Work Log Form</h2>
                    </div>
                    <form onSubmit={sl} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Tasks Completed Today</label>
                          <textarea required rows={2} value={lf.cp} onChange={e => setLf({...lf, cp: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="List items or features completed..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Blockers / Dependencies</label>
                          <textarea value={lf.bl} onChange={e => setLf({...lf, bl: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="Any blockers (or None)..." />
                        </div>
                      </div>
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Tomorrow's Work Plan</label>
                          <textarea required rows={2} value={lf.pl} onChange={e => setLf({...lf, pl: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="What are you working on tomorrow?..." />
                        </div>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Hours Worked</label>
                            <input required type="number" step="0.5" min="0.5" max="24" value={lf.hr} onChange={e => setLf({...lf, hr: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="8" />
                          </div>
                          <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all h-9">
                            SUBMIT WORK LOG
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
            
            {tb === "reports" && rl === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-950/60 rounded-2xl p-5 backdrop-blur-sm h-[560px] flex flex-col">
                  <h3 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider pb-3 border-b border-purple-900/20 mb-4 flex-shrink-0">Select Team Member</h3>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {us.map(u => (
                      <div key={u.id} onClick={() => setSu(u.email)} className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${su === u.email ? "bg-purple-950/40 border-purple-500/60 text-white shadow-[0_8px_20px_rgba(124,58,237,0.15),inset_0_1px_2px_rgba(255,255,255,0.05)] border-b-[4px] border-purple-600" : "bg-purple-950/5 border-purple-900/20 text-zinc-400 hover:border-purple-900/60 hover:text-zinc-200 border-b-[4px] border-purple-950"}`}>
                        <p className="text-xs font-bold truncate">{u.email}</p>
                        <p className="text-[9px] font-mono text-purple-400/60 mt-1 uppercase font-bold tracking-widest">{u.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-950/60 rounded-2xl p-5 backdrop-blur-sm h-[560px] flex flex-col">
                  <h3 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider pb-3 border-b border-purple-900/20 mb-4 flex-shrink-0">Activity Breakdown</h3>
                  {su ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-purple-950/10 border border-purple-900/20 p-4 rounded-2xl mb-4 flex-shrink-0 shadow-inner">
                        <p className="text-[10px] uppercase font-bold text-purple-400/50">Viewing Report For</p>
                        <p className="text-xs font-bold text-white truncate mt-1">{su}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-purple-900/10 text-center">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">Tasks</p>
                            <p className="text-lg font-black text-purple-400 mt-0.5">{tk.filter(t => t.assigned_to === su).length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">Done</p>
                            <p className="text-lg font-black text-emerald-400 mt-0.5">{tk.filter(t => t.assigned_to === su && t.status === "Completed").length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">Hours</p>
                            <p className="text-lg font-black text-fuchsia-400 mt-0.5">{wl.filter(w => w.email === su).reduce((acc, c) => acc + (c.hours || 0), 0)}h</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <div>
                          <p className="text-[10px] font-bold text-purple-400/50 uppercase tracking-wider mb-2">Submitted Daily Work Logs</p>
                          {wl.filter(w => w.email === su).length === 0 ? (
                            <div className="text-center text-[11px] font-mono text-purple-500/30 py-4">NO WORK LOGS FILED</div>
                          ) : wl.filter(w => w.email === su).map(w => (
                            <div key={w.id} className="bg-purple-950/5 border border-purple-900/10 rounded-xl p-3.5 mb-2 text-xs space-y-1.5 shadow-sm">
                              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-b border-purple-900/10 pb-1.5">
                                <span>{new Date(w.created_at).toLocaleDateString()}</span>
                                <span className="text-purple-400 font-bold">{w.hours} Hours Worked</span>
                              </div>
                              <p><strong className="text-purple-400/70 font-mono text-[10px] block uppercase">Completed:</strong> {w.completed}</p>
                              <p><strong className="text-amber-400/70 font-mono text-[10px] block uppercase">Blockers:</strong> {w.blockers}</p>
                              <p><strong className="text-blue-400/70 font-mono text-[10px] block uppercase">Next Plan:</strong> {w.plan}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-purple-400/50 uppercase tracking-wider mb-2">System Telemetry Sessions</p>
                          {ln.filter(l => l.email === su).length === 0 ? (
                            <div className="text-center text-[11px] font-mono text-purple-500/30 py-4">NO LOGINS LOGGED</div>
                          ) : ln.filter(l => l.email === su).map(l => (
                            <div key={l.id} className="bg-purple-950/5 border border-purple-900/10 rounded-xl p-2.5 flex items-center justify-between gap-4 shadow-sm mb-1.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${l.action === "LOGIN" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-3" /> : <ArrowUpRight className="w-2.5 h-3" />}
                                {l.action}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-500">{new Date(l.logged_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-purple-900/20 rounded-2xl">
                      <FileText className="w-8 h-8 text-purple-500/30 stroke-[1.5] mb-2" />
                      <p className="text-xs font-semibold text-purple-400/50 uppercase tracking-wider">Select a team member to load records.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {tb !== "reports" && (
              <div className="bg-purple-950/10 border border-purple-900/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)] border-b-[5px] border-purple-955/60 rounded-2xl p-4 md:p-5 overflow-hidden backdrop-blur-sm">
                {tb === "team" ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-900/20">
                        <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Team List & Options</h2>
                        {rl === "admin" && <button onClick={() => setMd("user")} className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold transition-all shadow-md border-b-2 border-purple-800 active:border-b-0 active:translate-y-px"><Plus className="w-3.5 h-3.5" /> Add Team Member</button>}
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Permission Tier</th><th className="pb-2 text-right">Options</th></tr></thead>
                          <tbody className="divide-y divide-purple-900/10">
                            {us.map(u => (
                              <tr key={u.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                                <td className="py-3 font-medium text-zinc-200">{u?.email}</td>
                                <td className="py-3">
                                  <select disabled={u?.id === au?.id} value={u?.role} onChange={async (e) => {
                                    const v = e.target.value;
                                    setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                    await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                    pn("operator_role_updated", { operator: u.email, role: v });
                                    await gd();
                                  }} className="bg-purple-950/50 text-xs border border-purple-900/30 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600 shadow-inner">
                                    {["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                  </select>
                                </td>
                                <td className="py-3 text-right">
                                  {u?.id !== au?.id ? (
                                    <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-purple-400/40 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                  ) : (
                                    <span className="text-[10px] text-purple-500/30 font-bold pr-1">YOUR ACCOUNT</span>
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
                        <h2 className="text-xs font-bold text-purple-400/70 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400/50" /> Recent Employee Logins & Logouts</h2>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Action Status</th><th className="pb-2 text-right">Date & Time</th></tr></thead>
                          <tbody className="divide-y divide-purple-900/10">
                            {ln.length === 0 ? <tr><td colSpan={3} className="py-4 text-center font-semibold text-purple-500/30">NO ACTIVITY TRACKED YET</td></tr> : ln.map(l => (
                              <tr key={l.id} className="text-zinc-300 hover:bg-purple-950/5 transition-colors">
                                <td className="py-3 font-medium text-zinc-200">{l.email}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${l.action === "LOGIN" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                    {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-3" /> : <ArrowUpRight className="w-2.5 h-3" />}
                                    {l.action}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-medium text-zinc-500">{new Date(l.logged_at).toLocaleString()}</td>
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
                      <h2 className="text-xs font-medium text-purple-400/70 uppercase tracking-wider">Item Management</h2>
                      {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold transition-all shadow-md border-b-2 border-purple-800 active:border-b-0 active:translate-y-px"><Plus className="w-3.5 h-3.5" /> Create New {tb === "proj" ? "Project" : "Task"}</button>}
                    </div>
                    {ld ? <div className="text-center py-8 font-mono text-purple-400/40 animate-pulse tracking-wide text-xs">LOADING DATA ENTRIES...</div> : tb === "dash" || tb === "proj" ? (
                      pj.length === 0 ? <div className="text-center py-8 text-xs text-purple-400/40 font-mono">NO PROJECTS FOUND</div> : (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[550px]">
                            <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-mono uppercase tracking-wider"><th className="pb-2">Project Name</th><th className="pb-2">Status State</th>{rl === "admin" && <th className="pb-2 text-right">Remove</th>}</tr></thead>
                            <tbody className="divide-y divide-purple-900/10">
                              {pj.map(p => (
                                <tr key={p.id} className="text-white hover:bg-purple-950/5 transition-colors">
                                  <td className="py-3.5 font-semibold text-xs md:text-sm text-zinc-200">{p.name}</td>
                                  <td className="py-3.5">
                                    <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                      const v = e.target.value;
                                      setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                      await sb.from("projects").update({ status: v }).eq("id", p.id);
                                      pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                      await gd();
                                    }} className="bg-purple-950/50 text-xs border border-purple-900/30 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600 shadow-inner">
                                      {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-purple-400/40 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead><tr className="text-purple-400/50 border-b border-purple-900/20 font-bold uppercase tracking-wider"><th className="pb-2">Task Title</th><th className="pb-2">Assigned Employee</th><th className="pb-2">Progress Status</th>{rl === "admin" && <th className="pb-2 text-right">Remove</th>}</tr></thead>
                          <tbody className="divide-y divide-purple-900/10">
                            {tk.map(t => (
                              <tr key={t.id} className="text-white hover:bg-purple-950/5 transition-colors">
                                <td className="py-3.5 font-semibold text-xs md:text-sm text-zinc-200">{t.title}</td>
                                <td className="py-3.5 font-medium text-xs text-zinc-400">{t.assigned_to || "Unassigned"}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer" && t.assigned_to !== au?.email} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v, assigned_to: t.assigned_to });
                                    await gd();
                                  }} className="bg-purple-950/50 text-xs border border-purple-900/30 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600 shadow-inner">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-purple-400/40 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
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
          <div className="bg-[#0D0A16] border border-purple-900/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-xs text-zinc-100 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-purple-400" /> Confirm Deletion</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Are you sure you want to permanently delete <span className="text-purple-300 font-mono bg-purple-950/40 px-1 py-0.5 rounded border border-purple-900/30">"{cf.name}"</span> from the system layer?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCf(null)} className="px-3.5 py-1.5 text-xs font-semibold bg-purple-950/40 border border-purple-900/40 hover:bg-purple-900/60 text-zinc-300 rounded-xl transition-colors">Cancel</button>
              <button onClick={ep} className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md border-b-2 border-rose-800 active:border-b-0 active:translate-y-px transition-all">Delete Item</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#110E1A] border border-purple-900/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border-b-4 border-purple-950">
            <header className="p-3.5 border-b border-purple-900/20 flex items-center justify-between bg-purple-950/10"><h3 className="font-bold text-zinc-100 text-xs uppercase tracking-wider">Create Entry</h3><button onClick={() => setMd(null)} className="text-zinc-500 hover:text-white p-0.5 rounded-md"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Project Name</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Core Storage Deployment" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status State</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("proj")} className="bg-purple-950/40 border border-purple-900/30 text-[11px] font-bold text-purple-300 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-purple-900/60 border-b-2 border-purple-900/80 active:border-b-0 active:translate-y-px transition-all"><Copy className="w-3 h-3" /> Save Template</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 font-bold text-white text-[11px] py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all">Save Project</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Task Name</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Run Integration Diagnostics" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Progress Status</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Assign to Employee</label><select value={tf.as} onChange={e => setTf({...tf, as: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner"><option value="">Unassigned</option>{us.map(u => <option key={u.id} value={u?.email}>{u?.email}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("task")} className="bg-purple-950/40 border border-purple-900/30 text-[11px] font-bold text-purple-300 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-purple-900/60 border-b-2 border-purple-900/80 active:border-b-0 active:translate-y-px transition-all"><Copy className="w-3 h-3" /> Save Template</button><button type="submit" className="bg-purple-600 hover:bg-purple-500 font-bold text-white text-[11px] py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all">Save Task</button></div>
              </form>
            ) : (
              <form onSubmit={cu} className="p-5 space-y-3.5">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="name@domain.com" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner" placeholder="••••••••••••" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Permission Level</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-purple-950/20 border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 shadow-inner">{["admin", "operator", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all mt-2">Create Account</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}