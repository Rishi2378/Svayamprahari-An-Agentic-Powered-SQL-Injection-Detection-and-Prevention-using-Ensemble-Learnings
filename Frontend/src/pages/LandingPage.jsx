import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiShieldCheck,
  HiCpuChip,
  HiBolt,
  HiArrowRight,
  HiServerStack,
  HiCommandLine,
  HiSparkles,
  HiSun,
  HiMoon,
  HiCheckCircle,
  HiCircleStack,
  HiSignal
} from 'react-icons/hi2';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('ensemble');
  
  // Theme state: defaults to light, reads from localStorage if exists
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('suraksha_home_theme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('suraksha_home_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Interactive mouse tracking for spatial lighting
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stats = [
    { label: 'ML Models Voting', value: '4 Ensembles', icon: HiCpuChip, sub: 'RF + GB + XGB + LSTM' },
    { label: 'Detection Accuracy', value: '99.4%', icon: HiShieldCheck, sub: 'Trained on 50k+ vectors' },
    { label: 'Decision Latency', value: '< 1.8ms', icon: HiBolt, sub: 'Real-time WAF inline' },
    { label: 'Autonomous Agents', value: '7 Threads', icon: HiServerStack, sub: 'Full self-healing pipeline' },
  ];

  const features = [
    {
      id: 'ensemble',
      title: 'ML Detection Engine',
      badge: 'ML Engine',
      desc: 'Blends Random Forest, Gradient Boosting, XGBoost, and Character-level LSTM classifiers with TF-IDF character & word n-grams to detect both known and zero-day SQL injections with minimal false positives.',
      codeSnippet: `// 4-Tier ML Weighted Voting
P_ml = (0.35 * P_rf) + (0.25 * P_gb) 
     + (0.25 * P_xgb) + (0.15 * P_lstm);
Confidence = (0.45 * ML) + (0.35 * Rule) + (0.20 * Behavior);`
    },
    {
      id: 'agents',
      title: 'Multi-Agent Mesh',
      badge: 'AI Architecture',
      desc: 'Seven stateful, threaded Python background agents exchange prioritized messages over an async bus: Monitoring -> Detection -> Threat Intel -> Decision -> Prevention -> Report, governed by a System Orchestrator.',
      codeSnippet: `// Threaded Message Bus Dispatch
[MonitoringAgent]  -> Tracks IP Velocity & Rates
[DetectionAgent]   -> Rule Signatures + ML Models
[ThreatIntelAgent] -> Global Attack Footprints
[DecisionAgent]    -> Verdict (ALLOW / BLOCK / MONITOR)
[PreventionAgent]  -> WAF Firewall & DB Commit`
    },
    {
      id: 'behavior',
      title: 'Behavioral Analyzers',
      badge: 'Active Defense',
      desc: 'Inspects real-time latency variations for Time-based attacks (SLEEP, WAITFOR), parses database error syntax leaks across 5 DB engines, and monitors session states for multi-stage Second-Order injections.',
      codeSnippet: `// Behavioral Correlation Engine
inspect_latency(request.duration, payload.sleep_param);
inspect_error_leakage(response.body, [MYSQL, PG, SQLITE]);
track_session_state(session_id, write_payload);`
    }
  ];

  const architectureLayers = [
    { 
      name: 'Layer 1: Ingress Interceptor', 
      detail: 'Reverse proxy and Express middleware capturing HTTP payloads before SQL parsing.', 
      lightColor: 'bg-white border-blue-100 shadow-sm', 
      darkColor: 'from-blue-500/20 to-cyan-500/10 border-white/10' 
    },
    { 
      name: 'Layer 2: Multi-Agent Mesh', 
      detail: '7 autonomous threaded agents calculating threat campaigns, velocity, and risk weights.', 
      lightColor: 'bg-white border-indigo-100 shadow-sm', 
      darkColor: 'from-indigo-500/20 to-purple-500/10 border-white/10' 
    },
    { 
      name: 'Layer 3: Hybrid Predictor', 
      detail: 'Parallel consensus voting across 4 machine learning models and dual TF-IDF vectorizers.', 
      lightColor: 'bg-white border-purple-100 shadow-sm', 
      darkColor: 'from-purple-500/20 to-pink-500/10 border-white/10' 
    },
    { 
      name: 'Layer 4: WAF Enforcement', 
      detail: 'Instant sub-2ms blocking (HTTP 403), IP throttling, and live streaming to the SOC dashboard.', 
      lightColor: 'bg-white border-emerald-100 shadow-sm', 
      darkColor: 'from-emerald-500/20 to-teal-500/10 border-white/10' 
    },
  ];

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#070b14] text-slate-100 selection:bg-indigo-500 selection:text-white' 
        : 'bg-[#f8fafc] text-slate-900 selection:bg-indigo-600 selection:text-white'
    }`}>
      
      {/* 3D Spatial Grid & Radial Mesh (Light and Dark Harmonized) */}
      <div 
        className="fixed inset-0 pointer-events-none transition-transform duration-700 ease-out z-0"
        style={{
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`
        }}
      >
        {isDark ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-purple-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-[-5%] left-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-200/40 via-blue-100/30 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-100/50 via-cyan-100/30 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
          </>
        )}
      </div>

      {/* Cyber Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: isDark ? 0.2 : 0.6,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 60%, transparent 100%)'
        }}
      />

      {/* Floating Spatial Navigation Header */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 pt-6">
        <div className={`backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center justify-between transition-colors duration-300 ${
          isDark 
            ? 'bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]' 
            : 'bg-white/80 border border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl p-[1px] shadow-lg ${
              isDark 
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-indigo-500/25' 
                : 'bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-indigo-500/15'
            }`}>
              <div className={`w-full h-full rounded-[11px] flex items-center justify-center ${
                isDark ? 'bg-[#0b101e]' : 'bg-white'
              }`}>
                <HiShieldCheck className={`text-xl ${isDark ? 'text-cyan-400' : 'text-indigo-600'}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-lg tracking-wider ${
                  isDark 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400' 
                    : 'text-slate-900'
                }`}>
                  SURAKSHA-AI
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest rounded-full ${
                  isDark 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  CORE PLATFORM
                </span>
              </div>
              <p className={`text-[10px] font-medium tracking-wide uppercase ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Automated SQL Injection Detection & Defense System
              </p>
            </div>
          </div>

          {/* Project-Specific Navigation Anchors */}
          <div className={`hidden md:flex items-center gap-8 text-xs font-semibold ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <a href="#ml-detection" className="hover:text-indigo-600 transition-colors">ML Detection</a>
            <a href="#multi-agents" className="hover:text-indigo-600 transition-colors">Multi-Agent Mesh</a>
            <a href="#live-waf" className="hover:text-indigo-600 transition-colors">Real-time WAF</a>
            <a href="#testing-app" className="hover:text-indigo-600 transition-colors">Testing App</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Light / Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs'
              }`}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDark ? <HiSun className="text-base" /> : <HiMoon className="text-base" />}
            </button>

            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark 
                  ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10' 
                  : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer group"
            >
              <span>Launch SOC</span>
              <HiArrowRight className="text-sm group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Surface */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 pt-16 pb-24">
        
        {/* Hero Tagline & Heading */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 ${
              isDark 
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-cyan-400 animate-ping' : 'bg-indigo-600 animate-pulse'}`} />
            <span>Autonomous Multi-Agent AI Web Application Firewall</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Zero-Trust Protection for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">
              Enterprise Databases
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed mb-10 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Suraksha-AI combines hybrid machine learning voting, delay correlation, and 7 autonomous background agents to detect and block SQL injection vectors in under 2 milliseconds.
          </motion.p>

          {/* Call-to-Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <HiShieldCheck className="text-lg text-cyan-200" />
              <span>Open SOC Dashboard</span>
              <HiArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/vulnerable-target')}
              className={`px-7 py-3.5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                isDark 
                  ? 'text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/40 backdrop-blur-md' 
                  : 'text-slate-800 bg-white hover:bg-slate-50 border-slate-300 shadow-sm hover:border-indigo-400'
              }`}
            >
              <HiCommandLine className={isDark ? 'text-slate-400' : 'text-indigo-600'} />
              <span>Simulate Testing App Attack</span>
            </button>
          </motion.div>
        </div>

        {/* 3D Floating Isometric Preview Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto perspective-[1200px]"
        >
          <div className={`relative rounded-2xl p-[1px] ${
            isDark 
              ? 'bg-gradient-to-b from-cyan-500/40 via-indigo-500/20 to-transparent shadow-[0_30px_100px_rgba(0,0,0,0.8)]' 
              : 'bg-gradient-to-b from-indigo-500/30 via-slate-200 to-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.1)]'
          }`}>
            <div className={`rounded-2xl p-6 sm:p-8 border transition-colors duration-300 ${
              isDark 
                ? 'bg-[#0b101e]/90 backdrop-blur-2xl border-white/10' 
                : 'bg-white/95 backdrop-blur-2xl border-slate-200'
            }`}>
              
              {/* Card Window Topbar */}
              <div className={`flex items-center justify-between pb-6 border-b mb-6 ${
                isDark ? 'border-white/10' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/90" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
                  <span className={`ml-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    suraksha://threat-mesh-live-feed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">ALL 7 AGENTS ACTIVE</span>
                </div>
              </div>

              {/* Card Interactive Grid Demo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left: Live Threat Ingress Terminal */}
                <div className={`lg:col-span-7 rounded-xl p-5 border font-mono text-xs space-y-3 ${
                  isDark 
                    ? 'bg-[#060913] border-white/5 text-slate-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-200 shadow-md'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <HiCommandLine className="text-cyan-400" />
                      INCOMING PAYLOAD INSPECTOR
                    </span>
                    <span className="text-[10px] text-slate-400">PORT 5000</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-slate-400 font-semibold">// Live telemetry from Testing App (Port 3000)</p>
                    <p className="text-cyan-300 font-medium break-all">
                      POST /api/target/login
                    </p>
                    <p className="text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20 font-bold break-all">
                      username=admin' UNION SELECT 1, sqlite_version(), password FROM users--
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Rule Engine Match:</span>
                      <span className="text-amber-400 font-bold">UNION_SELECT_INJECTION (98%)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>ML Ensemble Consensus:</span>
                      <span className="text-rose-400 font-bold">100% (RF 0.99, GB 0.99, XGB 0.98, LSTM 0.97)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Behavioral Correlation:</span>
                      <span className="text-cyan-400 font-bold">Stacked Command Delimiter Mapped</span>
                    </div>
                  </div>

                  <div className="mt-3 bg-gradient-to-r from-rose-950/60 to-purple-950/40 p-3 rounded-lg border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiShieldCheck className="text-rose-400 text-lg" />
                      <div>
                        <div className="text-rose-200 font-bold text-xs uppercase tracking-wider">Final Verdict: BLOCKED</div>
                        <div className="text-slate-400 text-[10px]">HTTP 403 Forbidden &bull; Transaction #TX-9041</div>
                      </div>
                    </div>
                    <span className="text-rose-400 font-extrabold text-sm font-mono">1.24 ms</span>
                  </div>
                </div>

                {/* Right: Architecture Micro-Status */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Autonomous Agent Pipeline
                  </h4>
                  {[
                    { agent: 'Monitoring Agent', status: 'Tracking Request Frequencies', color: 'text-blue-600' },
                    { agent: 'Detection Agent', status: 'Cached Model Fast-Path', color: 'text-indigo-600' },
                    { agent: 'Threat Intel Agent', status: 'Correlating IP Footprints', color: 'text-purple-600' },
                    { agent: 'Decision Agent', status: 'Threshold Consensus', color: 'text-cyan-600' },
                    { agent: 'Prevention Agent', status: 'WAF Rule & SQLite Commit', color: 'text-emerald-600' },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                      isDark 
                        ? 'bg-white/[0.02] border-white/5' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {item.agent}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono font-medium ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* 4 Key Metric Stat Cards */}
        <section className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/10 hover:border-cyan-500/30 shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.1)]' 
                    : 'bg-white hover:bg-white border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0_10px_25px_rgba(99,102,241,0.1)] hover:border-indigo-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                  isDark 
                    ? 'bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border-white/10 text-cyan-400' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  <Icon className="text-xl" />
                </div>
                <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight mb-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {s.value}
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {s.label}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {s.sub}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* ML Detection Engine Interactive Section */}
        <section id="ml-detection" className="mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
              Detection Technology
            </h2>
            <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Hybrid ML Ensemble & Delay Correlation
            </h3>
            <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Suraksha-AI prevents bypasses through multi-algorithm voting across Random Forest, Gradient Boosting, XGBoost, and neural character classifiers.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {features.map((feat) => (
                <button
                  key={feat.id}
                  onClick={() => setActiveTab(feat.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === feat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500'
                      : isDark
                        ? 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
                  }`}
                >
                  {feat.title}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {features.map((feat) => {
                if (feat.id !== activeTab) return null;
                return (
                  <motion.div
                    key={feat.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className={`p-8 rounded-2xl border backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                      isDark 
                        ? 'bg-white/[0.02] border-white/10' 
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="lg:col-span-6 space-y-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        isDark 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {feat.badge}
                      </span>
                      <h4 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {feat.title}
                      </h4>
                      <p className={`text-sm leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feat.desc}
                      </p>
                      
                      <div className="pt-2 flex items-center gap-4">
                        <button
                          onClick={() => navigate('/ai-detection')}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <HiSparkles />
                          <span>Test in Live Inspector</span>
                        </button>
                        <button
                          onClick={() => navigate('/ai-agents')}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            isDark 
                              ? 'text-slate-300 hover:text-white bg-white/5 border-white/10' 
                              : 'text-slate-700 hover:text-slate-900 bg-slate-50 border-slate-200'
                          }`}
                        >
                          View Agent Topology
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-slate-900 rounded-xl p-5 border border-slate-800 font-mono text-xs text-slate-200 shadow-md">
                      <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800 mb-3">
                        <span className="text-cyan-400 font-semibold">engine_logic.py</span>
                        <span className="text-[10px] text-slate-400">Ensemble Specification</span>
                      </div>
                      <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                        {feat.codeSnippet}
                      </pre>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* 4-Layer Architecture Section */}
        <section id="live-waf" className="mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">
              Defensive Pipeline
            </h2>
            <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Packet & Context Inspection Flow
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {architectureLayers.map((layer, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl border backdrop-blur-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${
                  isDark ? `bg-gradient-to-b ${layer.darkColor}` : layer.lightColor
                }`}
              >
                <div className={`text-3xl font-extrabold mb-3 font-mono ${
                  isDark ? 'text-white/20' : 'text-indigo-200'
                }`}>
                  0{idx + 1}
                </div>
                <h4 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {layer.name}
                </h4>
                <p className={`text-xs leading-relaxed font-normal ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {layer.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testing App Ecosystem Navigation Section */}
        <section id="testing-app" className="mt-32 max-w-5xl mx-auto">
          <div className={`p-8 sm:p-12 rounded-3xl border backdrop-blur-2xl text-center relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-cyan-950/40 border-white/10' 
              : 'bg-gradient-to-r from-indigo-50 via-white to-blue-50 border-indigo-100 shadow-md'
          }`}>
            <h3 className={`text-3xl font-extrabold mb-4 tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to Monitor & Test Your Defenses?
            </h3>
            <p className={`text-sm max-w-xl mx-auto mb-8 font-normal leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Observe live threat logs in the SOC Command Dashboard or run live injection benchmarks against the protected Testing App.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <HiShieldCheck className="text-base text-cyan-200" />
                <span>Go to SOC Dashboard</span>
              </button>

              <button
                onClick={() => navigate('/vulnerable-target')}
                className={`px-6 py-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                  isDark 
                    ? 'text-slate-200 bg-white/10 hover:bg-white/15 border-white/15' 
                    : 'text-slate-800 bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
                }`}
              >
                <HiCommandLine className="text-base text-amber-500" />
                <span>Open Testing App Sandbox</span>
              </button>

              <button
                onClick={() => navigate('/login')}
                className={`px-6 py-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark 
                    ? 'text-slate-300 hover:text-white bg-transparent border-white/10 hover:border-white/20' 
                    : 'text-slate-700 hover:text-slate-900 bg-transparent border-slate-300 hover:border-slate-400'
                }`}
              >
                Director Sign In
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Modern Minimal Footer */}
      <footer className={`relative z-20 border-t py-8 transition-colors duration-300 ${
        isDark 
          ? 'border-white/10 bg-[#050810]/80 backdrop-blur-xl text-slate-400' 
          : 'border-slate-200 bg-white/80 backdrop-blur-xl text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <HiShieldCheck className="text-lg text-indigo-600" />
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              &copy; {new Date().getFullYear()} Suraksha-AI
            </span>
            <span>&bull;</span>
            <span>Autonomous Web Application Security Suite</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/ai-agents')}>Agent Grid</span>
            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/reports')}>Incident Reports</span>
            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/settings')}>Settings</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
