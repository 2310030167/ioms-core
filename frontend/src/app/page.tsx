"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Plus, X, LogOut, Trash2, AlertTriangle, CheckCircle2, User, Menu, FileText, BarChart3, ClipboardCheck, Briefcase, IndianRupee, ShieldAlert, Users, ArrowDownLeft, ArrowUpRight, Clock, Copy, Calendar, MessageSquare, Layers } from "lucide-react";
import { sb } from "../lib/sb";
import ClientsPanel from "../components/ClientsPanel";
import FinanceLedger from "../components/FinanceLedger";
import AuditPanel from "../components/AuditPanel";

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
  const [cf, setCf] = useState<any>(null);
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
  const [al, setAl] = useState<any[]>([]);
  const [mo, setMo] = useState(false);
  const [su, setSu] = useState<string | null>(null);

  const lk = [
    { id: "dash", label: "Dashboard", icon: LayoutDashboard },
    { id: "proj", label: "Projects Vault", icon: FolderKanban },
    { id: "task", label: "Tasks Manager", icon: CheckSquare },
    ...(rl === "admin" || rl === "accounts" ? [
      { id: "clients", label: "Client Records", icon: Briefcase },
      { id: "finance", label: "Finance Book", icon: IndianRupee }
    ] : []),
    ...(rl === "admin" ? [
      { id: "team", label: "Team Directory", icon: Users },
      { id: "reports", label: "Analytics Panel", icon: BarChart3 },
      { id: "audit", label: "Security Center", icon: ShieldAlert }
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
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_ledger" }, () => { if (act) gd(); })
      .subscribe();
    return () => {
      act = false;
      sb.removeChannel(ch);
    };
  }, [au?.id, rl]);

  useEffect(() => {
    if (ts) {
      const t = setTimeout(() => setTs(null), 4000);
      return () => clearTimeout(t);
    }
  }, [ts]);

  useEffect(() => {
    if (tb === "audit" && rl !== "admin") {
      setTb("dash");
    }
  }, [tb, rl]);

  async function gd() {
    if (!sb.auth.getUser()) return;
    try {
      const { data: pD } = await sb.from("projects").select("*").order("created_at", { ascending: false });
      const { data: tD } = await sb.from("tasks").select("*").order("created_at", { ascending: false });
      const { data: sD } = await sb.auth.getSession();
      const uId = sD.session?.user?.id;
      
      if (uId) {
        const { data: rD } = await sb.from("user_roles").select("role").eq("id", uId).maybeSingle();
        if (rD) {
          setRl(rD.role);
          const { data: uD } = await sb.from("user_roles").select("*").order("email", { ascending: true });
          if (uD) {
            setUs(uD);
            setSt(prev => ({ ...prev, team: uD.length }));
          }
          const { data: lD } = await sb.from("user_logins").select("*").order("logged_at", { ascending: false }).limit(200);
          if (lD) setLn(lD);
          const { data: wD } = await sb.from("work_logs").select("*").order("created_at", { ascending: false });
          if (wD) setWl(wD);
          const { data: cD } = await sb.from("clients").select("*").order("created_at", { ascending: false });
          if (cD) setCl(cD);
          const { data: fD } = await sb.from("finance").select("*").order("created_at", { ascending: false });
          if (fD) setFi(fD);
          if (rD.role === "admin") {
            const { data: aD } = await sb.from("audit_ledger").select("*").order("created_at", { ascending: false });
            if (aD) setAl(aD);
          }
        }
      }
      
      const pL = pD || [];
      const tL = tD || [];
      setSt(prev => ({ ...prev, pipeline: pL.length, tasks: tL.length }));
      setPj(pL);
      setTk(tL);
    } catch (e) {} finally {
      setLd(false);
    }
  }

  const alog = async (act: string, tbl: string, tid: string, dtl: string) => {
    if (!au?.email) return;
    await sb.from("audit_ledger").insert([{ actor: au.email, action: act, target_table: tbl, target_id: tid, details: dtl }]);
  };

  const pn = async (v: string, d: any) => {
    try {
      let nTy = "SYSTEM";
      let ttl = "System Alert";
      let dt = {};

      if (v === "project_created") {
        nTy = "TASK_ASSIGNED";
        ttl = "Project Initialized";
        dt = { task_name: d.name, assigned_by: au?.email, deadline: "Review Hub" };
      } else if (v === "task_created") {
        nTy = "TASK_ASSIGNED";
        ttl = "Task Assigned";
        dt = { task_name: d.title, assigned_by: au?.email, deadline: "Tomorrow 6 PM" };
      } else if (v === "operator_role_updated") {
        nTy = "SYSTEM";
        ttl = "Security Vector Amendment";
        dt = { task_name: `Role altered for ${d.operator} to ${d.role}`, assigned_by: "System Admin", deadline: "Immediate" };
      }

      const targetEmail = v === "project_created" ? au?.email : (d.assigned_to || au?.email);
      const tg = us.find(x => x.email === targetEmail);

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: tg?.phone || "919347426516",
          email: targetEmail,
          type: nTy,
          ttl: ttl,
          dt: dt
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  const li = async (e: React.FormEvent) => {
    e.preventDefault();
    setEr("");
    if (!fm.email.trim() || !fm.password.trim()) {
      setTs({ msg: "Authentication keys required", type: "err" });
      return;
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: fm.email, password: fm.password });
    if (error) {
      setEr(error.message);
      setTs({ msg: "Login details are incorrect.", type: "err" });
    } else {
      if (data?.user?.email) {
        await sb.from("user_logins").insert([{ email: data.user.email, action: "LOGIN" }]);
        await sb.from("audit_ledger").insert([{ actor: data.user.email, action: "AUTH_LOGIN", target_table: "auth", target_id: data.user.id, details: "User session established" }]);
      }
      setFm({ email: "", password: "" });
      await gd();
      setTs({ msg: "Successfully logged in.", type: "ok" });
    }
  };

  const lo = async () => {
    if (au?.email) {
      await sb.from("user_logins").insert([{ email: au.email, action: "LOGOUT" }]);
      await alog("AUTH_LOGOUT", "auth", au.id, "User session closed");
    }
    await sb.auth.signOut();
    setPj([]);
    setTk([]);
    setUs([]);
    setLn([]);
    setWl([]);
    setCl([]);
    setFi([]);
    setAl([]);
    setRl("viewer");
    setTb("dash");
    setSu(null);
    setSt({ pipeline: 0, tasks: 0, team: 1 });
    setTs({ msg: "Logged out successfully.", type: "ok" });
    setMo(false);
  };

  const cu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uf.em.trim() || !uf.pw.trim()) {
      setTs({ msg: "Credentials required", type: "err" });
      return;
    }
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uf)
    });
    const d = await res.json();
    if (d.ok) {
      pn("operator_provisioned", { id: "SYSTEM", name: uf.em, status: uf.rl });
      await alog("PROVISION_USER", "user_roles", uf.em, `Account initialized with tier: ${uf.rl}`);
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
    if (!lf.cp.trim() || !lf.pl.trim()) {
      setTs({ msg: "Task strings cannot be empty", type: "err" });
      return;
    }
    const h = parseFloat(lf.hr);
    if (isNaN(h) || h <= 0 || h > 24) {
      setTs({ msg: "Operational metrics hour scope error", type: "err" });
      return;
    }
    const { error } = await sb.from("work_logs").insert([{
      email: au.email,
      completed: lf.cp,
      blockers: lf.bl || "None",
      plan: lf.pl,
      hours: h
    }]);
    if (!error) {
      await alog("SUBMIT_WORKLOG", "work_logs", au.email, `Logged: ${lf.hr} hours`);
      setLf({ cp: "", bl: "None", pl: "", hr: "" });
      setTs({ msg: "Daily work log submitted successfully.", type: "ok" });
      await gd();
    } else {
      setTs({ msg: "Failed to submit work log.", type: "err" });
    }
  };

  const ac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cff.nm.trim() || !cff.em.trim()) {
      setTs({ msg: "Client references required", type: "err" });
      return;
    }
    const { error } = await sb.from("clients").insert([{ name: cff.nm, email: cff.em, company: cff.co }]);
    if (!error) {
      await alog("CREATE_CLIENT", "clients", cff.nm, `Client entity: ${cff.co || "Individual"}`);
      setCff({ nm: "", em: "", co: "" });
      setMd(null);
      setTs({ msg: "Client file saved successfully.", type: "ok" });
      await gd();
    }
  };

  const af = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fff.cn.trim()) {
      setTs({ msg: "Transaction context payer entity missing", type: "err" });
      return;
    }
    const v = parseFloat(fff.am);
    if (isNaN(v) || v <= 0) {
      setTs({ msg: "Financial gross numbers must be non-negative values", type: "err" });
      return;
    }
    const { error } = await sb.from("finance").insert([{ type: fff.ty, client_name: fff.cn, amount: v, status: fff.st, description: fff.ds || "None" }]);
    if (!error) {
      await alog("RECORD_TRANSACTION", "finance", fff.cn, `Type: ${fff.ty}, Gross: ${fff.am} INR`);
      setFff({ ty: "Invoice", cn: "", am: "", st: "Pending", ds: "" });
      setMd(null);
      setTs({ msg: "Ledger transaction recorded successfully.", type: "ok" });
      await gd();
    }
  };

  const ap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pf.name.trim()) {
      setTs({ msg: "Project name parameters required", type: "err" });
      return;
    }
    const { data, error } = await sb.from("projects").insert([{ name: pf.name, status: pf.status }]).select().single();
    if (!error && data) {
      pn("project_created", data);
      await alog("CREATE_PROJECT", "projects", data.id, `Name: ${pf.name}`);
      setPf({ name: "", status: "New" });
      setMd(null);
      setTs({ msg: "Project created successfully.", type: "ok" });
      await gd();
    }
  };

  const at = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tf.title.trim()) {
      setTs({ msg: "Task trace parameters required", type: "err" });
      return;
    }
    const { data, error } = await sb.from("tasks").insert([{ title: tf.title, status: tf.status, assigned_to: tf.as || null }]).select().single();
    if (!error && data) {
      pn("task_created", data);
      await alog("CREATE_TASK", "tasks", data.id, `Title: ${tf.title}`);
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
    const tbl = cf.type === "proj" ? "projects" : cf.type === "task" ? "tasks" : cf.type === "client" ? "clients" : cf.type === "finance" ? "finance" : "user_roles";
    if (cf.type === "user") {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cf.id })
      });
      const d = await res.json();
      if (d.ok) {
        await alog("PURGE_USER", "user_roles", cf.id, `Target username: ${cf.name}`);
        setTs({ msg: "User account deleted.", type: "ok" });
        if (su === cf.name) setSu(null);
        await gd();
      }
    } else {
      const { error } = await sb.from(tbl).delete().eq("id", cf.id);
      if (!error) {
        await alog("DELETE_RECORD", tbl, cf.id, `Label identifier: ${cf.name}`);
        setTs({ msg: "Item deleted from database.", type: "ok" });
        await gd();
      }
    }
    setCf(null);
  };

  const tM = { Todo: 0, Assigned: 0, In_Progress: 0, Review: 0, Testing: 0, Completed: 0, Blocked: 0 };
  tk.forEach(t => { if (t?.status && tM[t.status as keyof typeof tM] !== undefined) tM[t.status as keyof typeof tM] ++; });

  if (!au) {
    return (
      <div className="min-h-screen w-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden isolate text-slate-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.03),transparent_24%)] pointer-events-none"></div>
        <div className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] relative z-10">
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
              <Layers className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center">Clerias Platform</h2>
            <p className="text-[10px] text-slate-400 tracking-[0.2em] mt-1.5 uppercase font-mono font-bold">Secure Environment Gate</p>
          </div>
          <form onSubmit={li} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5 font-mono">Operator ID</label>
              <input required type="email" value={fm.email} onChange={e => setFm({...fm, email: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="name@company.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5 font-mono">Passkey String</label>
              <input required type="password" value={fm.password} onChange={e => setFm({...fm, password: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="••••••••••••" />
            </div>
            {er && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 text-center font-medium font-mono">{er}</div>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-3.5 rounded-xl tracking-widest uppercase transition-all duration-150 mt-1 shadow-sm shadow-indigo-600/20">
              Verify Node Authorization
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-600 font-sans selection:bg-indigo-500/10 overflow-hidden relative isolate">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.06),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.03),transparent_26%)]"></div>
      
      {ts && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_12px_24px_-10px_rgba(15,23,42,0.16)] flex items-start gap-3 border-t-4 border-t-indigo-500">
          {ts.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1"><p className="text-xs font-semibold text-slate-700">{ts.msg}</p></div>
        </div>
      )}
      
      <div className={`fixed inset-0 bg-slate-950/10 backdrop-blur-sm z-30 transition-opacity duration-300 lg:hidden ${mo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setMo(false)}></div>
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-40 transition-transform duration-300 ease-out lg:static lg:translate-x-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] ${mo ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-slate-800 uppercase tracking-widest font-mono">Clerias Desk</span>
            </div>
            <button onClick={() => setMo(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm"><User className="w-3.5 h-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-900 truncate">{au?.email}</p>
                <p className="text-[8px] font-mono text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{rl}</p>
              </div>
            </div>
            <button onClick={lo} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold tracking-wider text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all uppercase shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><LogOut className="w-3 h-3 text-slate-400" /> Disconnect</button>
          </div>
          
          <nav className="space-y-0.5">
            {lk.map(l => (
              <button key={l.id} onClick={() => { setTb(l.id); setMo(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border ${tb === l.id ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-[0_1px_2px_rgba(99,102,241,0.06)]" : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"}`}>
                <l.icon className={`w-4 h-4 ${tb === l.id ? "text-indigo-600" : "text-slate-400"}`} />{l.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative z-10">
        <header className="h-16 border-b border-slate-200/80 flex items-center justify-between px-6 flex-shrink-0 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setMo(true)} className="p-2 text-slate-500 hover:text-slate-700 lg:hidden rounded-xl bg-white border border-slate-200"><Menu className="w-4 h-4" /></button>
            <h1 className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-900 font-mono">
              {tb === "team" ? "Access Control" : tb === "reports" ? "Analytics Terminal" : tb === "clients" ? "Client Registry" : tb === "finance" ? "Accounting Ledger" : tb === "audit" ? "Security Log" : tb} Hub
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]"></span><span className="text-[9px] font-mono text-slate-500 tracking-widest font-bold uppercase">System_Active</span></div>
        </header>
        
        <section className="flex-1 overflow-y-auto p-6 lg:p-7">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ t: "Active Pipelines", v: ld ? "..." : st.pipeline }, { t: "Assigned Operations", v: ld ? "..." : st.tasks }, { t: "Authorization Tier", v: ld ? "..." : rl.toUpperCase() }].map((c, i) => (
                <div key={i} className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] p-5 rounded-xl relative group overflow-hidden">
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">{c.t}</h3>
                  <p className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">{c.v}</p>
                </div>
              ))}
            </div>
            
            {tb === "dash" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] p-5 rounded-xl overflow-x-auto">
                    <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-100 min-w-[500px]"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Pipeline Distribution Overview</h3><div className="text-slate-400 font-mono text-[9px] tracking-wider uppercase">Metrics Node</div></div>
                    <div className="grid grid-cols-7 gap-3 min-w-[500px]">
                      {Object.entries(tM).map(([stVal, count]) => {
                        const maxTasks = Math.max(...Object.values(tM), 1);
                        const pct = Math.min((count / maxTasks) * 100, 100);
                        return (
                          <div key={stVal} className="bg-white border border-slate-200/80 px-1 py-4.5 rounded-xl text-center flex flex-col justify-between items-center group shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                            <span className="text-[9px] font-bold tracking-wider text-slate-400 group-hover:text-slate-600 uppercase truncate w-full font-mono">{stVal.replace("_", " ")}</span>
                            <div className="w-2.5 bg-slate-100/80 h-28 my-3.5 rounded-full relative flex items-end justify-center border border-slate-200/60 shadow-inner">
                              <div style={{ height: `${Math.max(pct, count > 0 ? 10 : 0)}%` }} className="w-full bg-indigo-600 rounded-full transition-all duration-500 ease-out shadow-xs"></div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 block">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] p-5 rounded-xl">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Recent Activity Feed</h3><span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Historical Stream</span></div>
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                      {ln.length === 0 ? (
                        <div className="text-center text-[10px] font-mono text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Activity Stream Registered</div>
                      ) : ln.slice(0, 5).map(l => (
                        <div key={l.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_10px_-6px_rgba(15,23,42,0.18)]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{l.email}</p>
                              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Dispatched access instruction event action token bundle</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`inline-block text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border mb-1 font-mono ${l.action === "LOGIN" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>{l.action}</span>
                            <p className="text-[9px] font-mono text-slate-400">{new Date(l.logged_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 flex flex-col h-[235px]">
                    <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Upcoming Deadlines</h3><Calendar className="w-3.5 h-3.5 text-slate-400" /></div>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                      {tk.filter(t => t.status !== "Completed").length === 0 ? (
                        <div className="text-center text-[10px] font-mono text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Pending Node Targets</div>
                      ) : tk.filter(t => t.status !== "Completed").slice(0, 3).map(t => (
                        <div key={t.id} className="bg-white border border-slate-200/80 p-3 rounded-xl flex flex-col justify-between gap-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs text-slate-900 font-semibold tracking-wide truncate flex-1">{t.title}</span>
                            <span className="text-[9px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex-shrink-0 font-bold tracking-widest">{t.status.replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[9px] font-mono text-slate-400">
                            <span className="truncate max-w-[120px]">{t.assigned_to || "Unallocated"}</span>
                            <span className="text-indigo-600 font-bold uppercase tracking-wider">Tomorrow 6 PM</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 flex flex-col h-[235px]">
                    <div className="pb-3 border-b border-slate-100 mb-3"><h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">Structural Blueprints</h3></div>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                      {bp.length === 0 ? <div className="text-center text-[10px] font-mono text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Blueprint Nodes</div> : bp.map(b => (
                        <div key={b.id} onClick={() => { if(rl !== "viewer") abp(b); }} className={`bg-white border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3 group shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${rl !== "viewer" ? "cursor-pointer hover:bg-slate-50 hover:border-slate-300" : ""}`}>
                          <span className="text-xs text-slate-900 truncate font-semibold tracking-wide">{b.name}</span>
                          {(rl === "admin" || rl === "operator") && <button onClick={(e) => dbp(b.id, e)} className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {rl !== "admin" && (
                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 lg:col-span-3 h-[420px] flex flex-col">
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4 flex-shrink-0 font-mono">Operational Context Summary Matrix</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-shrink-0">
                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono">Operator Identity Node</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-1">{au?.email}</p>
                      </div>
                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.02)] grid grid-cols-2 gap-2 text-center">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Allocated</p>
                          <p className="text-base font-bold text-indigo-600 mt-0.5">{tk.filter(t => t.assigned_to === au?.email).length}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resolved</p>
                          <p className="text-base font-bold text-emerald-600 mt-0.5">{tk.filter(t => t.assigned_to === au?.email && t.status === "Completed").length}</p>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.02)] text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Committed Hours Quantum</p>
                        <p className="text-base font-bold text-fuchsia-600 mt-0.5">{wl.filter(w => w.email === au?.email).reduce((acc, c) => acc + (c.hours || 0), 0)} Hours</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 font-mono">Committed Daily Log Traces</p>
                        {wl.filter(w => w.email === au?.email).length === 0 ? (
                          <div className="text-center text-[10px] font-mono text-slate-400 py-5 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Log Records Filed</div>
                        ) : wl.filter(w => w.email === au?.email).map(w => (
                          <div key={w.id} className="bg-white border border-slate-200/80 rounded-xl p-4 mb-2.5 text-xs space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-100 pb-2">
                              <span>{new Date(w.created_at).toLocaleDateString()}</span>
                              <span className="text-indigo-600 font-bold uppercase tracking-wider">{w.hours} Hours Worked</span>
                            </div>
                            <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Executed:</strong> {w.completed}</p>
                            <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Blockers:</strong> {w.blockers}</p>
                            <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Target:</strong> {w.plan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {rl === "operator" && (
                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 lg:col-span-3">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                      <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest font-mono">Mandatory Daily Log Form Node</h2>
                    </div>
                    <form onSubmit={sl} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Operational Metrics Completed</label>
                          <textarea required rows={2} value={lf.cp} onChange={e => setLf({...lf, cp: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="Detail operational tasks resolved..." />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">System Blockers / Dependencies</label>
                          <textarea value={lf.bl} onChange={e => setLf({...lf, bl: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="Specify system bounds (or None)..." />
                        </div>
                      </div>
                      <div className="space-y-3.5 flex flex-col justify-between">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Next Framework Iteration Vector</label>
                          <textarea required rows={2} value={lf.pl} onChange={e => setLf({...lf, pl: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="Outline target framework milestones..." />
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Hours Quantum</label>
                            <input required type="number" step="0.5" min="0.5" max="24" value={lf.hr} onChange={e => setLf({...lf, hr: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="8.0" />
                          </div>
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-xl shadow-sm transition-all h-[40px]">
                            Commit Metrics Node
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {tb === "clients" && (rl === "admin" || rl === "accounts") && (
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden">
                <ClientsPanel clients={cl} onAdd={() => setMd("client")} show={rl === "admin"} />
              </div>
            )}
            {tb === "finance" && (rl === "admin" || rl === "accounts") && (
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden">
                <FinanceLedger transactions={fi} onAdd={() => setMd("finance")} show={rl === "admin" || rl === "accounts"} />
              </div>
            )}
            {tb === "audit" && rl === "admin" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] overflow-hidden">
                <AuditPanel logs={al} />
              </div>
            )}

            {tb === "reports" && rl === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 h-[560px] flex flex-col">
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4 flex-shrink-0 font-mono">Personnel Node Registry</h3>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {us.map(u => (
                      <div key={u.id} onClick={() => setSu(u.email)} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${su === u.email ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[0_1px_2px_rgba(99,102,241,0.06)]" : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                        <p className="text-xs font-semibold truncate text-slate-900">{u.email}</p>
                        <p className="text-[9px] font-mono text-indigo-600 mt-1 uppercase font-bold tracking-widest">{u.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(15,23,42,0.03)] rounded-xl p-5 h-[560px] flex flex-col">
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4 flex-shrink-0 font-mono">Operational Metrics Output</h3>
                  {su ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-white border border-slate-200/80 p-5 rounded-xl mb-4 flex-shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono">Isolated Node Stream</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-1 tracking-wide">{su}</p>
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 text-center">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Operations</p>
                            <p className="text-base font-bold text-indigo-600 mt-1">{tk.filter(t => t.assigned_to === su).length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resolved</p>
                            <p className="text-base font-bold text-emerald-600 mt-1">{tk.filter(t => t.assigned_to === su && t.status === "Completed").length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Duration</p>
                            <p className="text-base font-bold text-fuchsia-600 mt-1">{wl.filter(w => w.email === su).reduce((acc, c) => acc + (c.hours || 0), 0)}h</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 font-mono">Committed Work Logs</p>
                          {wl.filter(w => w.email === su).length === 0 ? (
                            <div className="text-center text-[10px] font-mono text-slate-400 py-5 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Metrics Logged</div>
                          ) : wl.filter(w => w.email === su).map(w => (
                            <div key={w.id} className="bg-white border border-slate-200/80 rounded-xl p-4 mb-2.5 text-xs space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-100 pb-2">
                                <span>{new Date(w.created_at).toLocaleDateString()}</span>
                                <span className="text-indigo-600 font-bold uppercase tracking-wider">{w.hours} Hours Logged</span>
                              </div>
                              <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Executed:</strong> {w.completed}</p>
                              <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Blockers:</strong> {w.blockers}</p>
                              <p className="text-slate-600"><strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mr-1">Target:</strong> {w.plan}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 font-mono">Telemetry Traces</p>
                          {ln.filter(l => l.email === su).length === 0 ? (
                            <div className="text-center text-[10px] font-mono text-slate-400 py-5 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider bg-slate-50/40">No Traces Registered</div>
                          ) : ln.filter(l => l.email === su).map(l => (
                            <div key={l.id} className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] mb-2">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border ${l.action === "LOGIN" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                                {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                                {l.action}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{new Date(l.logged_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                      <FileText className="w-6 h-6 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Select data vector node to stream logs.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {tb !== "reports" && tb !== "clients" && tb !== "finance" && tb !== "audit" && (
              <div className="bg-white border border-slate-200/70 shadow-2xs rounded-xl p-5 overflow-hidden">
                {tb === "team" ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest font-mono">Authorized Operators</h2>
                        {rl === "admin" && <button onClick={() => setMd("user")} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/10"><Plus className="w-3.5 h-3.5" /> Provision Node</button>}
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono"><th className="pb-3">Account Email</th><th className="pb-3">Permission Vector</th><th className="pb-3 text-right">Purge Matrix</th></tr></thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {us.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                <td className="py-3.5 font-semibold text-slate-700 tracking-wide">{u?.email}</td>
                                <td className="py-3.5">
                                  <select disabled={u?.id === au?.id} value={u?.role} onChange={async (e) => {
                                    const v = e.target.value;
                                    setUs(prev => prev.map(x => x.id === u.id ? { ...x, role: v } : x));
                                    await sb.from("user_roles").update({ role: v }).eq("id", u.id);
                                    pn("operator_role_updated", { operator: u.email, role: v });
                                    await alog("ALTER_ROLE", "user_roles", u.id, `Modified permission vector to: ${v}`);
                                    await gd();
                                  }} className="bg-white text-[10px] border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-mono tracking-wider focus:outline-none focus:border-indigo-400 shadow-3xs">
                                    {["admin", "operator", "accounts", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                  </select>
                                </td>
                                <td className="py-3.5 text-right">
                                  {u?.id !== au?.id ? (
                                    <button onClick={() => setCf({ id: u.id, type: "user", name: u.email })} className="text-slate-400 hover:text-rose-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-mono font-bold tracking-widest pr-1">SELF_NODE</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest flex items-center gap-2 font-mono"><Clock className="w-3.5 h-3.5 text-slate-400" /> Infrastructure Access Logs</h2>
                      </div>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead><tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono"><th className="pb-3">Operator</th><th className="pb-3">Action Code</th><th className="pb-3 text-right">Timestamp Vector</th></tr></thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {ln.length === 0 ? <tr><td colSpan={3} className="py-5 text-center font-mono text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/30 rounded-xl">No Session Context Recorded</td></tr> : ln.map(l => (
                              <tr key={l.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                <td className="py-3.5 tracking-wide text-slate-700 font-medium">{l.email}</td>
                                <td className="py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border ${l.action === "LOGIN" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                                    {l.action === "LOGIN" ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                                    {l.action}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right font-mono text-slate-400 text-[10px]">{new Date(l.logged_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest font-mono">Data Frame Clusters</h2>
                      {tb !== "dash" && (rl === "admin" || rl === "operator") && <button onClick={() => setMd(tb)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/10"><Plus className="w-3.5 h-3.5" /> Initialize {tb === "proj" ? "Pipeline" : "Operation"}</button>}
                    </div>
                    {ld ? <div className="text-center py-10 font-mono text-slate-400 animate-pulse tracking-widest text-[10px] uppercase">Retrieving Node Framework...</div> : tb === "dash" || tb === "proj" ? (
                      pj.length === 0 ? <div className="text-center py-10 text-[10px] font-mono text-slate-400 uppercase tracking-wider border border-dashed border-slate-200 rounded-xl bg-slate-50/40">No Active Pipelines Found</div> : (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[550px]">
                            <thead><tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono"><th className="pb-3">Pipeline Label</th><th className="pb-3">Deployment Status</th>{rl === "admin" && <th className="pb-3 text-right">Purge</th>}</tr></thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              {pj.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                  <td className="py-3.5 font-semibold text-xs tracking-wide text-slate-700">{p.name}</td>
                                  <td className="py-3.5">
                                    <select disabled={rl === "viewer"} value={p.status} onChange={async (e) => {
                                      const v = e.target.value;
                                      setPj(prev => prev.map(x => x.id === p.id ? { ...x, status: v } : x));
                                      await sb.from("projects").update({ status: v }).eq("id", p.id);
                                      pn("project_status_updated", { id: p.id, name: p.name, status: v });
                                      await alog("ALTER_PROJECT_STATE", "projects", p.id, `Status update: ${v}`);
                                      await gd();
                                    }} className="bg-white text-[10px] border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 shadow-3xs">
                                      {["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: p.id, type: "proj", name: p.name })} className="text-slate-400 hover:text-rose-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[550px]">
                          <thead><tr className="text-slate-400 border-b border-slate-200/60 font-semibold uppercase tracking-widest text-[9px] font-mono"><th className="pb-3">Operation Target</th><th className="pb-3">Allocated Operator</th><th className="pb-3">Execution State</th>{rl === "admin" && <th className="pb-3 text-right">Purge</th>}</tr></thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {tk.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                <td className="py-3.5 font-semibold text-xs tracking-wide text-slate-700">{t.title}</td>
                                <td className="py-3.5 text-xs text-slate-500 tracking-wide font-medium">{t.assigned_to || "Unassigned"}</td>
                                <td className="py-3.5">
                                  <select disabled={rl === "viewer" && t.assigned_to !== au?.email} value={t.status} onChange={async (e) => {
                                    const v = e.target.value;
                                    setTk(prev => prev.map(x => x.id === t.id ? { ...x, status: v } : x));
                                    await sb.from("tasks").update({ status: v }).eq("id", t.id);
                                    pn("task_status_updated", { id: t.id, title: t.title, status: v, assigned_to: t.assigned_to });
                                    await alog("ALTER_TASK_STATE", "tasks", t.id, `Status update: ${v}`);
                                    await gd();
                                  }} className="bg-white text-[10px] border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-indigo-400 shadow-3xs">
                                    {["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                                  </select>
                                </td>
                                {rl === "admin" && <td className="py-3.5 text-right"><button onClick={() => setCf({ id: t.id, type: "task", name: t.title })} className="text-slate-400 hover:text-rose-400 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-xl max-w-sm w-full p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_16px_36px_-18px_rgba(15,23,42,0.35)]">
            <h3 className="font-bold text-xs uppercase tracking-widest font-mono text-slate-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-indigo-600" /> Purge Matrix Node</h3>
            <p className="text-xs text-slate-500 leading-relaxed tracking-wide">Are you completely certain you want to permanently delete <span className="text-indigo-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">"{cf.name}"</span> from cloud cluster records?</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCf(null)} className="px-3.5 py-2 text-[10px] font-bold tracking-widest uppercase bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">Cancel</button>
              <button onClick={ep} className="px-3.5 py-2 text-[10px] font-bold tracking-widest uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all">Execute Purge</button>
            </div>
          </div>
        </div>
      )}
      
      {md && (
        <div className="fixed inset-0 bg-slate-950/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-xl max-w-md w-full overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_20px_40px_-18px_rgba(15,23,42,0.35)]">
            <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-white"><h3 className="font-bold text-slate-900 text-[10px] tracking-widest uppercase font-mono">Initialize Registry Entry</h3><button onClick={() => setMd(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md"><X className="w-4 h-4" /></button></header>
            {md === "proj" ? (
              <form onSubmit={ap} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Pipeline Vector Identifier</label><input required type="text" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="e.g., Core Storage Deployment" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Deployment Status State</label><select value={pf.status} onChange={e => setPf({...pf, status: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">{["New", "Planning", "Development", "Testing", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-1"><button type="button" onClick={() => sbp("proj")} className="bg-white border border-slate-200 text-[10px] font-bold tracking-widest uppercase text-slate-600 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"><Copy className="w-4 h-4" /> Save Template</button><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-xl transition-all shadow-sm shadow-indigo-600/10">Commit Pipeline</button></div>
              </form>
            ) : md === "task" ? (
              <form onSubmit={at} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Operation Title Specification</label><input required type="text" value={tf.title} onChange={e => setTf({...tf, title: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="e.g., Run Integration Diagnostics" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Execution Progress Status</label><select value={tf.status} onChange={e => setTf({...tf, status: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">{["Todo", "In_Progress", "Testing", "Completed", "Blocked"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Allocate Operators Node</label><select value={tf.as} onChange={e => setTf({...tf, as: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"><option value="">Unassigned</option>{us.map(u => <option key={u.id} value={u?.email}>{u?.email}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3 pt-1"><button type="button" onClick={() => sbp("task")} className="bg-white border border-slate-200 text-[10px] font-bold tracking-widest uppercase text-slate-600 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"><Copy className="w-4 h-4" /> Save Template</button><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-xl transition-all shadow-sm shadow-indigo-600/10">Commit Task</button></div>
              </form>
            ) : md === "client" ? (
              <form onSubmit={ac} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Full Registry Contact Label</label><input required type="text" value={cff.nm} onChange={e => setCff({...cff, nm: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="e.g., Jane Doe" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Corporate Brand Entity</label><input type="text" value={cff.co} onChange={e => setCff({...cff, co: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="e.g., Acme Corp (Optional)" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Communication Target Email</label><input required type="email" value={cff.em} onChange={e => setCff({...cff, em: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="client@domain.com" /></div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-xl transition-all mt-1 shadow-sm shadow-indigo-600/10">Commit Client Profile</button>
              </form>
            ) : md === "finance" ? (
              <form onSubmit={af} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Classification</label><select value={fff.ty} onChange={e => setFff({...fff, ty: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"><option value="Invoice">Invoice</option><option value="Expense">Expense</option><option value="Quotation">Quotation</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Ledger State</label><select value={fff.st} onChange={e => setFff({...fff, st: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Approved">Approved</option></select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Transaction Payer / Payee Reference</label><input required type="text" value={fff.cn} onChange={e => setFff({...fff, cn: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="e.g., Acme Holdings" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Total Financial Quantum Tally (INR)</label><input required type="number" min="1" value={fff.am} onChange={e => setFff({...fff, am: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="50000" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Ledger Transaction Memo</label><textarea rows={2} value={fff.ds} onChange={e => setFff({...fff, ds: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)] resize-none" placeholder="Enter transfer specs..." /></div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-xl transition-all mt-1 shadow-sm shadow-indigo-600/10">Commit Accounting Item</button>
              </form>
            ) : (
              <form onSubmit={cu} className="p-5 space-y-4">
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Operator Access Email</label><input required type="email" value={uf.em} onChange={e => setUf({...uf, em: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="name@domain.com" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Secure Access Passkey Vector</label><input required type="password" value={uf.pw} onChange={e => setUf({...uf, pw: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]" placeholder="••••••••••••" /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 tracking-widest mb-1.5 font-mono">Authorization Level Class</label><select value={uf.rl} onChange={e => setUf({...uf, rl: e.target.value})} className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">{["admin", "operator", "accounts", "viewer"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-widest uppercase py-3 rounded-xl transition-all mt-1 shadow-sm shadow-indigo-600/10">Provision Node Profile</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}