"use client";
import React, { useState, useEffect, useRef } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Copy, Users, Menu, Clock, ArrowUpRight, ArrowDownLeft, FileText, BarChart3, ClipboardCheck, Briefcase, IndianRupee } from "lucide-react";
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
  const [cf, setCf] = useState<{ id: string; type: "proj" | "task" | "user" | "client" | "finance"; name: string } | null>(null);
  const [pf, setPf] = useState({ name: "", status: "New" });
  const [tf, setTf] = useState({ title: "", status: "Todo", as: "" });
  const [uf, setUf] = useState({ em: "", pw: "", rl: "viewer" });
  const [lf, setLf] = useState({ cp: "", bl: "", pl: "", hr: "" });
  const [cff, setCff] = useState({ nm: "", em: "", co: "" });
  const [fff, setFff] = useState({ ty: "Invoice", cn: "", am: "", st: "Pending", ds: "" });
  const [bp, setBp] = useState<any[]>([]);
  const [rl, setRl] = useState<string>("viewer");
  const [us, setUs] = useState<any[]>([]);
  const [ln, setLn] = useState<any[]>([]);
  const [wl, setWl] = useState<any[]>([]);
  const [cl, setCl] = useState<any[]>([]);
  const [fi, setFi] = useState<any[]>([]);
  const [mo, setMo] = useState(false);
  const [su, setSu] = useState<string | null>(null);

  const lk = [
    { id: "dash", label: "Dashboard", icon: LayoutDashboard },
    { id: "proj", label: "Projects", icon: FolderKanban },
    { id: "task", label: "Tasks", icon: CheckSquare },
    ...(rl === "admin" || rl === "accounts" ? [
      { id: "clients", label: "Clients Panel", icon: Briefcase },
      { id: "finance", label: "Finance Ledger", icon: IndianRupee }
    ] : []),
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
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => { if (act) gd(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "finance" }, () => { if (act) gd(); })
      .subscribe();
    return () => {
      act = false;
      sb.removeChannel(ch);
    };
  }, [au?.id, rl]);

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
          const { data: cData } = await sb.from("clients").select("*").order("created_at", { ascending: false });
          if (cData) setCl(cData);
          const { data: fData } = await sb.from("finance").select("*").order("created_at", { ascending: false });
          if (fData) setFi(fData);
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
    setCl([]);
    setFi([]);
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

  const ac = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sb.from("clients").insert([{ name: cff.nm, email: cff.em, company: cff.co }]);
    if (!error) {
      setCff({ nm: "", em: "", co: "" });
      setMd(null);
      setTs({ msg: "Client file saved successfully.", type: "ok" });
      await gd();
    }
  };

  const af = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sb.from("finance").insert([{ type: fff.ty, client_name: fff.cn, amount: parseFloat(fff.am), status: fff.st, description: fff.ds }]);
    if (!error) {
      setFff({ ty: "Invoice", cn: "", am: "", st: "Pending", ds: "" });
      setMd(null);
      setTs({ msg: "Ledger transaction recorded successfully.", type: "ok" });
      await gd();
    }
  };

  const ap = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await sb.from("projects").insert([{ name: pf.name, status: pf.status }]).select().single();
    if (!error && data) {
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
      setTf({ title: "", status: "Todo", as: "" });
      setMd(null);
      setTs({ msg: "Task saved successfully.", type: "ok" });
      await gd();
    }
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
    const tbl = cf.type === "proj" ? "projects" : cf.type === "task" ? "tasks" : cf.type === "client" ? "clients" : cf.type === "finance" ? "finance" : "user_roles";
    if (cf.type === "user") {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cf.id })
      });
      const d = await res.json();
      if (d.ok) {
        setTs({ msg: "User account deleted.", type: "ok" });
        if (su === cf.name) setSu(null);
        await gd();
      }
    } else {
      const { error } = await sb.from(tbl).delete().eq("id", cf.id);
      if (!error) {
        setTs({ msg: "Item deleted from database.", type: "ok" });
        await gd();
      }
    }
    setCf(null);
  };

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (t?.status && tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM]++; });

  if (!au) {
    return (
      <div className="min-h-screen w-screen bg-[#000000] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none"></div>
        <div className="w-full max-w-[380px] obsidian-panel p-8 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-4 shadow-md">
              <Activity className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight text-center">Welcome Back</h2>
            <p className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={li} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60 transition-colors shadow-inner" placeholder="yourname@domain.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60 transition-colors shadow-inner" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-purple-200 bg-purple-950/40 border border-purple-900/50 rounded-xl p-2.5 text-center shadow-inner font-semibold">{er}</div>}
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-3 rounded-xl tracking-wide mt-2 border-b-[4px] border-purple-800 active:border-b-0 active:translate-y-[4px] transition-all shadow-lg shadow-purple-950/50">
              SIGN IN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-zinc-300 font-sans overflow-hidden relative">
      <AmbientCanvas />
      {ts && (
        <div className="fixed top-5 right-5 z-50 max-w-xs w-[calc(100vw-2rem)] bg-[#0C0916]/90 border border-purple-800/40 backdrop-blur-md rounded-xl p-4 shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-3">
          {ts.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
          <div className="flex-1"><p className="text-xs font-semibold text-zinc-200">{ts.msg}</p></div>
        </div>
      )}
      
      <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#050508] border-r border-zinc-900 flex flex-col justify-between z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 overflow-y-auto flex-1 relative z-10">
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-2.5"><Activity className="w-5 h-5 text-purple-400 stroke-[1.5]" /><span className="font-extrabold text-sm text-white tracking-tight">IOMS Central</span></div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="mb-6 p-4 bg-[#0A0A0F] border border-zinc-800 rounded-2xl shadow-inner">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 flex-shrink-0"><User className="w-3.5 h-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{au?.email}</p>
                <p className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold text-purple-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all"><LogOut className="w-3 h-3" /> Sign Out</button>
          </div>
          <nav className="space-y-1">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${tb === l.id ? "bg-zinc-900 text-purple-400 border border-zinc-800" : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"}`}>
                <l.icon className={`w-4 h-4 ${tb === l.id ? "text-purple-400" : "text-zinc-400"}`} />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative z-10">
        <header className="h-14 border-b border-zinc-900/80 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur-md bg-black/40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMo(true)} className="p-1.5 text-zinc-400 hover:text-white lg:hidden rounded-lg bg-zinc-900 border border-zinc-800"><Menu className="w-4 h-4" /></button>
            <h1 className="text-xs font-bold tracking-wider uppercase text-zinc-400">
              {tb === "team" ? "Team Roles" : tb === "reports" ? "Individual Reports" : tb === "clients" ? "Clients Panel" : tb === "finance" ? "Finance Ledger" : tb} Hub
            </h1>
          </div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span><span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">System Active</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ t: "Total Projects", v: ld ? "..." : st.pipeline }, { t: "Total Tasks", v: ld ? "..." : st.tasks }, { t: "Your Account Role", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="obsidian-panel p-5"><h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{c.t}</h3><p className="text-3xl font-bold text-white mt-1 tracking-tight">{c.v}</p></div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="obsidian-panel p-6 lg:col-span-2 overflow-x-auto">
                    <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-zinc-900/60 min-w-[500px]"><h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Task Status Tracker</h3><div className="text-zinc-600 font-mono text-[10px] tracking-widest">DATA_REFRESH_OK</div></div>
                    <div className="grid grid-cols-7 gap-4 min-w-[500px]">
                      {Object.entries(tM).map(([stVal, count]) => {
                        const maxTasks = Math.max(...Object.values(tM), 1);
                        const pct = Math.min((count / maxTasks) * 100, 100);
                        return (
                          <div key={stVal} className="bg-black/40 border border-zinc-900/60 px-2 py-4 rounded-2xl text-center flex flex-col justify-between items-center group hover:border-purple-500/20 transition-all">
                            <span className="text-[10px] font-bold tracking-wide text-zinc-500 uppercase truncate w-full transition-colors font-mono">{stVal.replace("_", " ")}</span>
                            <div className="capsule-pillar-wrap">
                              <div style={{ height: `${Math.max(pct, count > 0 ? 12 : 0)}%` }} className="capsule-pillar-fill" />
                            </div>
                            <span className="text-xs font-mono font-bold text-zinc-300 group-hover:text-white transition-colors">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="obsidian-panel p-5">
                    <div className="pb-3 mb-3 border-b border-zinc-900/60"><h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Quick Templates</h3></div>
                    <div className="space-y-1.5 max-h-[148px] overflow-y-auto pr-0.5">
                      {bp.length === 0 ? <div className="text-center text-[11px] font-mono text-zinc-600 py-6">NO TEMPLATES CONFIGURED</div> : bp.map(b => (
                        <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-[#0A0A0F]/40 border border-zinc-900/60 p-2.5 rounded-xl flex items-center justify-between gap-2 group transition-colors ${rl !== "viewer" ? "cursor-pointer hover:border-zinc-800" : ""}`}>
                          <span className="text-xs text-zinc-300 truncate font-semibold">{b.name}</span>
                          {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-zinc-500 hover:text-purple-400 p-0.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {rl === "operator" && (
                  <div className="obsidian-panel p-6">
                    <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-zinc-900/60">
                      <ClipboardCheck className="w-4 h-4 text-purple-400" />
                      <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Mandatory Daily Work Log Form</h2>
                    </div>
                    <form onSubmit={sl} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tasks Completed Today</label>
                          <textarea required rows={2} value={lf.cp} onChange={e => setLf({...lf, cp: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="List items or features completed..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Current Blockers / Dependencies</label>
                          <textarea value={lf.bl} onChange={e => setLf({...lf, bl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="Any blockers (or None)..." />
                        </div>
                      </div>
                      <div className="space-y-4 flex flex-col justify-between">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tomorrow's Work Plan</label>
                          <textarea required rows={2} value={lf.pl} onChange={e => setLf({...lf, pl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="What are you working on tomorrow?..." />
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Hours Worked</label>
                            <input required type="number" step="0.5" min="0.5" max="24" value={lf.hr} onChange={e => setLf({...lf, hr: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="8" />
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
                <div className="obsidian-panel p-5 h-[560px] flex flex-col">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pb-3 border-b border-zinc-900/60 mb-4 flex-shrink-0">Select Team Member</h3>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {us.map(u => (
                      <div key={u.id} onClick={() => setSu(u.email)} className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${su === u.email ? "bg-zinc-900 border-zinc-700 text-white shadow-lg" : "bg-[#0A0A0F]/60 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"}`}>
                        <p className="text-xs font-bold truncate">{u.email}</p>
                        <p className="text-[10px] font-mono text-purple-400 font-bold mt-1 uppercase tracking-widest">{u.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="obsidian-panel p-5 h-[560px] flex flex-col">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pb-3 border-b border-zinc-900/60 mb-4 flex-shrink-0">Activity Breakdown</h3>
                  {su ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-[#0A0A0F]/80 border border-zinc-900 p-4 rounded-xl mb-4 flex-shrink-0 shadow-inner">
                        <p className="text-[10px] uppercase font-bold text-zinc-500">Report Context</p>
                        <p className="text-xs font-bold text-white truncate mt-1">{su}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-900/60 text-center">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Tasks</p>
                            <p className="text-xl font-black text-purple-400 mt-0.5">{tk.filter(t => t.assigned_to === su).length}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Done</p>
                            <p className="text-xl font-black text-emerald-400 mt-0.5">{tk.filter(t => t.assigned_to === su && t.status === "Completed").length}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">Hours</p>
                            <p className="text-xl font-black text-fuchsia-400 mt-0.5">{wl.filter(w => w.email === su).reduce((acc, c) => acc + (c.hours || 0), 0)}h</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Submitted Daily Work Logs</p>
                          {wl.filter(w => w.email === su).length === 0 ? (
                            <div className="text-center text-[11px] font-mono text-zinc-600 py-4">NO WORK LOGS FILED</div>
                          ) : wl.filter(w => w.email === su).map(w => (
                            <div key={w.id} className="bg-zinc-950/40 border border-zinc-900 p-3.5 mb-2 text-xs space-y-1.5 rounded-xl shadow-sm">
                              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-b border-zinc-900/40 pb-1.5">
                                <span>{new Date(w.created_at).toLocaleDateString()}</span>
                                <span className="text-purple-400 font-bold">{w.hours} Hours Worked</span>
                              </div>
                              <p><strong className="text-purple-400/80 font-mono text-[10px] block uppercase">Completed:</strong> {w.completed}</p>
                              <p><strong className="text-amber-400/80 font-mono text-[10px] block uppercase">Blockers:</strong> {w.blockers}</p>
                              <p><strong className="text-blue-400/80 font-mono text-[10px] block uppercase">Next Plan:</strong> {w.plan}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">System Telemetry Sessions</p>
                          {ln.filter(l => l.email === su).length === 0 ? (
                            <div className="text-center text-[11px] font-mono text-zinc-600 py-4">NO LOGINS LOGGED</div>
                          ) : ln.filter(l => l.email === su).map(l => (
                            <div key={l.id} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-2.5 flex items-center justify-between gap-4 shadow-sm mb-1.5">
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-2xl">
                      <FileText className="w-8 h-8 text-zinc-700 mb-2" />
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select a team member to load records.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {tb !== "reports" && tb !== "clients" && tb !== "finance" && (
              <div className="obsidian-panel p-5 overflow-hidden">
                {tb === "team" ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900/60">
                        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Team List & Options</h2>
                        {rl === "admin" && <button onClick={() => setMd("user")} className="bg-white hover:bg-zinc-100 text-black text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold shadow-md transition-all active:scale-[0.98]"><Plus className="w-3.5 h-3.5" /> Add Team Member</button>}
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Permission Tier</th><th className="pb-2 text-right">Options</th></tr></thead>
                          <tbody className="divide-y divide-zinc-900/40">
                            {us.map(u => (
                              <tr key={u.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3 font-medium text-zinc-200">{u?.email}</td>
                                <td className="py-3">
                                  <select disabled={u?.id === au?.id} value={u?.role} onChange={async (e) => {
                                    const v = e.target.value;
                                    setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                    await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                    pn("operator_role_updated", { operator: u.email, role: v });
                                    await gd();
                                  }} className="bg-black text-xs border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600">
                                    {["admin", "operator", "accounts", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                  </select>
                                </td>
                                <td className="py-3 text-right">
                                  {u?.id !== au?.id ? (
                                    <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-zinc-500 hover:text-purple-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 font-bold pr-1 uppercase">Your Account</span>
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
                        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Recent Logins & Logouts</h2>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">User Email</th><th className="pb-2">Action Status</th><th className="pb-2 text-right">Date & Time</th></tr></thead>
                          <tbody className="divide-y divide-zinc-900/40">
                            {ln.length === 0 ? <tr><td colSpan={3} className="py-4 text-center font-mono text-zinc-600">NO ACTIVITY TRACKED YET</td></tr> : ln.map(l => (
                              <tr key={l.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3 font-medium text-zinc-200">{l.email}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${l.action === "LOGIN" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
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
                      <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Item Configurations</h2>
                      {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-white hover:bg-zinc-100 text-black text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold shadow-md transition-all active:scale-[0.98]"><Plus className="w-3.5 h-3.5" /> Create New {tb === "proj" ? "Project" : "Task"}</button>}
                    </div>
                    {ld ? <div className="text-center py-8 font-mono text-zinc-600 animate-pulse tracking-wide text-xs">LOADING DATA ENTRIES...</div> : tb === "dash" || tb === "proj" ? (
                      pj.length === 0 ? <div className="text-center py-8 text-xs text-zinc-600 font-mono">NO PROJECTS FOUND</div> : (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[550px]">
                            <thead><tr className="text-zinc-500 border-b border-zinc-900 font-mono uppercase tracking-wider"><th className="pb-2">Project Name</th><th className="pb-2">Status State</th>{rl === "admin" && <th className="pb-2 text-right">Remove</th>}</tr></thead>
                            <tbody className="divide-y divide-zinc-900/40">
                              {pj.map(p => (
                                <tr key={p.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-colors">
                                  <td className="py-3.5 font-semibold text-xs md:text-sm text-zinc-100">{p.name}</td>
                                  <td className="py-3.5">
                                    <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                      const v = e.target.value;
                                      setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                      await sb.from("projects").update({ status: v }).eq("id", p.id);
                                      pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                      await gd();
                                    }} className="bg-black text-xs border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600 shadow-inner">
                                      {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-zinc-500 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
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
                                <td className="py-3.5 font-semibold text-xs md:text-sm text-zinc-100">{t.title}</td>
                                <td className="py-3.5 font-mono text-xs text-zinc-500">{t.assigned_to || "Unassigned"}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer" && t.assigned_to !== au?.email} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v, assigned_to: t.assigned_to });
                                    await gd();
                                  }} className="bg-black text-xs border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-200 font-semibold focus:outline-none focus:border-purple-600 shadow-inner">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-zinc-500 hover:text-rose-400 p-1.5 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#050508] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-purple-400" /> Confirm Deletion</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Are you sure you want to permanently delete <span className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">"{cf.name}"</span>?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCf(null)} className="px-4 py-2 text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl transition-colors">Cancel</button>
              <button onClick={ep} className="px-4 py-2 text-xs font-bold bg-white text-black rounded-xl shadow-md transition-all active:scale-[0.98]">Delete Item</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#050508] border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <header className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/40"><h3 className="font-bold text-white text-xs uppercase tracking-wider">Create Entry</h3><button onClick={() => setMd(null)} className="text-zinc-500 hover:text-white p-1 rounded-md"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Project Name</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Core Storage Deployment" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Status State</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("proj")} className="bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-zinc-850 transition-all"><Copy className="w-3 h-3" /> Save Template</button><button type="submit" className="bg-white hover:bg-zinc-100 font-bold text-black text-[11px] py-2.5 rounded-xl transition-all">Save Project</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Task Name</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Run Integration Diagnostics" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Progress Status</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Assign to Employee</label><select value={tf.as} onChange={e => setTf({...tf, as: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner"><option value="">Unassigned</option>{us.map(u => <option key={u.id} value={u?.email}>{u?.email}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => sbp("task")} className="bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-zinc-850 transition-all"><Copy className="w-3 h-3" /> Save Template</button><button type="submit" className="bg-white hover:bg-zinc-100 font-bold text-black text-[11px] py-2.5 rounded-xl transition-all">Save Task</button></div>
              </form>
            ) : md === "client" ? (
              <form onSubmit={ac} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Contact Name</label><input required type="text" value={cff.nm} onChange={e => setCff({...cff, nm: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Jane Doe" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Corporate Entity / Business Brand</label><input type="text" value={cff.co} onChange={e => setCff({...cff, co: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Acme Corp (Optional)" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label><input required type="email" value={cff.em} onChange={e => setCff({...cff, em: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="client@domain.com" /></div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all mt-2">Initialize Client Record</button>
              </form>
            ) : md === "finance" ? (
              <form onSubmit={af} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Classification</label><select value={fff.ty} onChange={e => setFff({...fff, ty: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner"><option value="Invoice">Invoice</option><option value="Expense">Expense</option><option value="Quotation">Quotation</option></select></div>
                  <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Status State</label><select value={fff.st} onChange={e => setFff({...fff, st: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Approved">Approved</option></select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Payer / Payee Identity Reference</label><input required type="text" value={fff.cn} onChange={e => setFff({...fff, cn: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="e.g., Acme Holdings" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Total Amount Tally (INR)</label><input required type="number" min="1" value={fff.am} onChange={e => setFff({...fff, am: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="50000" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Transaction Parameters / Memo</label><textarea rows={2} value={fff.ds} onChange={e => setFff({...fff, ds: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="Contextual data regarding transfer specifications..." /></div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all mt-2">Log Financial Entry</button>
              </form>
            ) : (
              <form onSubmit={cu} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="name@domain.com" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner" placeholder="••••••••••••" /></div>
                <div><label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Permission Level</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600 shadow-inner">{["admin", "operator", "accounts", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs py-2.5 rounded-xl border-b-2 border-purple-800 active:border-b-0 active:translate-y-px transition-all mt-2">Create Account</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}