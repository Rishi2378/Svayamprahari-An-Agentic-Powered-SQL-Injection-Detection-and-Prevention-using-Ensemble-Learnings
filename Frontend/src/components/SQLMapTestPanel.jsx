/**
 * SQLMapTestPanel.jsx
 * ─────────────────────────────────────────────────────
 * A self-contained Dashboard panel that lets an operator:
 *  1. Configure SSH connection to Kali Linux VM
 *  2. Launch sqlmap against the New1 target app
 *  3. Launch the project's Python test scripts on Kali
 *  4. Watch live streaming logs in a terminal-style view
 * ─────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Log level → styling map ────────────────────────────────────────────────
const LEVEL_STYLE = {
  INFO:    'text-slate-300',
  SUCCESS: 'text-emerald-400 font-semibold',
  WARNING: 'text-amber-400',
  ERROR:   'text-red-400 font-semibold',
};

const LEVEL_BADGE = {
  INFO:    'bg-slate-700 text-slate-200',
  SUCCESS: 'bg-emerald-900/60 text-emerald-300',
  WARNING: 'bg-amber-900/60 text-amber-300',
  ERROR:   'bg-red-900/60 text-red-300',
};

// Available Python test scripts (in project root)
const ALL_SCRIPTS = [
  'test_auth_bypass.py',
  'test_boolean_sqli.py',
  'test_tautology_sqli.py',
  'test_union_sqli.py',
  'test_error_sqli.py',
  'test_time_sqli.py',
  'test_stacked_sqli.py',
  'test_obfuscated_sqli.py',
  'test_polyglot_sqli.py',
  'test_oob_sqli.py',
  'test_second_order.py',
];

// ── Main Component ─────────────────────────────────────────────────────────
const SQLMapTestPanel = () => {
  // SSH config (persisted in localStorage)
  const [sshHost, setSshHost] = useState(() => localStorage.getItem('suraksha_kali_ip') || '');
  const [sshPort, setSshPort] = useState(() => localStorage.getItem('suraksha_kali_port') || '22');
  const [sshUser, setSshUser] = useState(() => localStorage.getItem('suraksha_kali_user') || 'kali');
  const [sshPassword, setSshPassword] = useState(() => localStorage.getItem('suraksha_kali_pass') || 'kali');

  // Target & proxy
  const [targetUrl, setTargetUrl] = useState(() => localStorage.getItem('suraksha_target_url') || 'http://10.0.2.2:4000/api/login');
  const [burpProxy, setBurpProxy] = useState(() => localStorage.getItem('suraksha_burp_proxy') || 'http://127.0.0.1:8080');
  const [extraArgs, setExtraArgs] = useState('');
  const [useBurp, setUseBurp] = useState(false);

  // Script selection
  const [selectedScripts, setSelectedScripts] = useState(ALL_SCRIPTS.slice(0, 3));

  // Connection testing state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState(null); // { success: bool, message: string }

  // Save to localStorage whenever credentials change
  useEffect(() => {
    if (sshHost) localStorage.setItem('suraksha_kali_ip', sshHost);
    if (sshPort) localStorage.setItem('suraksha_kali_port', sshPort);
    if (sshUser) localStorage.setItem('suraksha_kali_user', sshUser);
    if (sshPassword) localStorage.setItem('suraksha_kali_pass', sshPassword);
    if (targetUrl) localStorage.setItem('suraksha_target_url', targetUrl);
    if (burpProxy) localStorage.setItem('suraksha_burp_proxy', burpProxy);
  }, [sshHost, sshPort, sshUser, sshPassword, targetUrl, burpProxy]);

  // Test SSH Connection
  const testSSHConnection = async () => {
    if (!sshHost.trim()) {
      setConnStatus({ success: false, message: 'Please enter a VM IP address first.' });
      return;
    }
    setIsTestingConn(true);
    setConnStatus(null);
    try {
      const res = await fetch('/api/sqlmap/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh_host: sshHost.trim(),
          ssh_port: parseInt(sshPort) || 22,
          ssh_user: sshUser.trim(),
          ssh_password: sshPassword
        })
      });
      const data = await res.json();
      setConnStatus({ success: data.success, message: data.message });
    } catch (err) {
      setConnStatus({ success: false, message: 'Could not reach Suraksha Backend on port 5000.' });
    } finally {
      setIsTestingConn(false);
    }
  };

  // Quick preset handler
  const applyPreset = (host, port, user = 'kali', target = 'http://192.168.56.1:4000/api/login') => {
    setSshHost(host);
    setSshPort(port);
    setSshUser(user);
    setTargetUrl(target);
    setConnStatus(null);
  };

  // UI state
  const [logs, setLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('sqlmap'); // 'sqlmap' | 'scripts'
  const [showConfig, setShowConfig] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const logEndRef = useRef(null);
  const sseRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── SSE: connect to live log stream ───────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const es = new EventSource('/api/sqlmap/stream');
    sseRef.current = es;

    es.onmessage = (evt) => {
      try {
        const entry = JSON.parse(evt.data);
        setLogs(prev => [...prev.slice(-400), entry]); // Keep last 400 lines
        if (entry.msg?.includes('SCAN COMPLETE') || entry.msg?.includes('TEST SCRIPTS COMPLETE')) {
          setIsScanning(false);
        }
      } catch {}
    };

    es.onerror = () => {
      // SSE reconnects automatically; don't spam state
    };
  }, []);

  // Close SSE when unmounting
  useEffect(() => {
    return () => sseRef.current?.close();
  }, []);

  // ── Action: Start sqlmap ───────────────────────────────────────────────────
  const startSQLMap = async () => {
    if (!sshHost.trim()) {
      alert('Please enter the Kali Linux VM IP address first.');
      return;
    }

    setLogs([]);
    setIsScanning(true);
    connectSSE();

    try {
      const res = await fetch('/api/sqlmap/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh_host:     sshHost.trim(),
          ssh_port:     parseInt(sshPort) || 22,
          ssh_user:     sshUser,
          ssh_password: sshPassword,
          target_url:   targetUrl,
          burp_proxy:   useBurp ? burpProxy : '',
          extra_args:   extraArgs,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsScanning(false);
        alert(data.message || 'Failed to start scan.');
      }
    } catch (err) {
      setIsScanning(false);
      alert('Could not reach backend. Make sure Flask is running.');
    }
  };

  // ── Action: Start Python test scripts ─────────────────────────────────────
  const startScripts = async () => {
    if (!sshHost.trim()) {
      alert('Please enter the Kali Linux VM IP address first.');
      return;
    }
    if (selectedScripts.length === 0) {
      alert('Select at least one test script.');
      return;
    }

    setLogs([]);
    setIsScanning(true);
    connectSSE();

    try {
      const res = await fetch('/api/sqlmap/run-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh_host:     sshHost.trim(),
          ssh_port:     parseInt(sshPort) || 22,
          ssh_user:     sshUser,
          ssh_password: sshPassword,
          target_url:   targetUrl.replace('/api/login', ''), // base URL for scripts
          scripts:      selectedScripts,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsScanning(false);
        alert(data.message || 'Failed to run scripts.');
      }
    } catch (err) {
      setIsScanning(false);
      alert('Could not reach backend. Make sure Flask is running.');
    }
  };

  // ── Action: Stop ──────────────────────────────────────────────────────────
  const stopScan = async () => {
    await fetch('/api/sqlmap/stop', { method: 'POST' });
    setIsScanning(false);
    sseRef.current?.close();
  };

  // ── Action: Clear logs ─────────────────────────────────────────────────────
  const clearLogs = () => setLogs([]);

  // ── Script checkbox toggle ────────────────────────────────────────────────
  const toggleScript = (name) => {
    setSelectedScripts(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  // ── Stats from logs ────────────────────────────────────────────────────────
  const logStats = {
    total:   logs.length,
    success: logs.filter(l => l.level === 'SUCCESS').length,
    warning: logs.filter(l => l.level === 'WARNING').length,
    error:   logs.filter(l => l.level === 'ERROR').length,
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <section className="metric-card p-5 space-y-5">

      {/* ── Section Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Animated threat icon */}
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-400 text-[20px]">
              bug_report
            </span>
          </div>
          <div>
            <h3 className="font-bold text-text-custom text-[14px] leading-tight">
              SQLMap Attack Test Runner
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Triggers sqlmap on Kali Linux VM via SSH · Streams live logs · Suraksha-AI monitors &amp; blocks
            </p>
          </div>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-2">
          {isScanning && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              SCAN ACTIVE
            </span>
          )}
          <button
            onClick={() => setShowConfig(v => !v)}
            className="text-[11px] text-text-muted hover:text-text-custom transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showConfig ? 'expand_less' : 'tune'}
            </span>
            {showConfig ? 'Hide Config' : 'Configure'}
          </button>
        </div>
      </div>

      {/* ── Configuration Panel ── */}
      {showConfig && (
        <div className="bg-bg-custom/50 border border-border-custom rounded-xl p-4 space-y-4">

          {/* SSH Connection */}
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">lan</span>
              Kali Linux SSH Connection
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-semibold block mb-1">VM IP Address *</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.56.101"
                  value={sshHost}
                  onChange={e => setSshHost(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-semibold block mb-1">SSH Port</label>
                <input
                  type="number"
                  value={sshPort}
                  onChange={e => setSshPort(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  value={sshUser}
                  onChange={e => setSshUser(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-semibold block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sshPassword}
                    onChange={e => setSshPassword(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-custom"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Network Presets & Test Connection Action */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-custom/40">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-text-muted font-medium mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('127.0.0.1', '2222', 'kali')}
                  className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono transition-all cursor-pointer"
                  title="Use if you configured VirtualBox NAT Port Forwarding (Host 127.0.0.1:2222 -> Guest 22)"
                >
                  ⚡ Port Forward (127.0.0.1:2222)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('192.168.56.101', '22', 'kali')}
                  className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono transition-all cursor-pointer"
                  title="Use if Kali is attached to VirtualBox Host-Only Adapter"
                >
                  🌐 Host-Only (192.168.56.101:22)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('10.0.2.15', '22', 'kali')}
                  className="px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/20 text-[10px] font-mono transition-all cursor-pointer"
                  title="Direct NAT address"
                >
                  NAT (10.0.2.15:22)
                </button>
              </div>

              <button
                type="button"
                onClick={testSSHConnection}
                disabled={isTestingConn || !sshHost}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[14px] ${isTestingConn ? 'animate-spin' : ''}`}>
                  {isTestingConn ? 'sync' : 'network_check'}
                </span>
                <span>{isTestingConn ? 'Pinging Kali SSH...' : 'Save & Test Connection'}</span>
              </button>
            </div>

            {/* Connection Test Result Feedback Banner */}
            {connStatus && (
              <div className={`mt-2.5 p-2.5 rounded-lg text-[11px] flex items-start gap-2 border transition-all ${
                connStatus.success 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                  : 'bg-red-950/40 text-red-300 border-red-500/30'
              }`}>
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                  {connStatus.success ? 'check_circle' : 'error'}
                </span>
                <div className="leading-snug">
                  <span className="font-semibold">{connStatus.success ? 'Success: ' : 'Notice: '}</span>
                  <span>{connStatus.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Target & Proxy */}
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-red-400">target</span>
              Target &amp; Proxy Config
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-semibold block mb-1">
                  Target URL (New1 app)
                  <span className="ml-1 text-amber-400">— use your Windows host IP, not localhost</span>
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-text-muted font-semibold">
                    Burp Suite Proxy (on Kali VM)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBurp}
                      onChange={e => setUseBurp(e.target.checked)}
                      className="h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-muted">Enable</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={burpProxy}
                  onChange={e => setBurpProxy(e.target.value)}
                  disabled={!useBurp}
                  className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono disabled:opacity-40"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] text-text-muted font-semibold block mb-1">
                Extra sqlmap flags (optional)
              </label>
              <input
                type="text"
                value={extraArgs}
                onChange={e => setExtraArgs(e.target.value)}
                placeholder='e.g. --forms --crawl=2 --dbs'
                className="w-full px-2.5 py-2 rounded-lg bg-card-custom border border-border-custom text-text-custom text-[12px] outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Action Tabs ── */}
      <div className="flex gap-2 border-b border-border-custom pb-0">
        {['sqlmap', 'scripts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[12px] font-semibold rounded-t-lg transition-colors -mb-px border border-transparent ${
              activeTab === tab
                ? 'bg-card-custom border-border-custom border-b-card-custom text-text-custom'
                : 'text-text-muted hover:text-text-custom'
            }`}
          >
            {tab === 'sqlmap' ? (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">pest_control</span>
                SQLMap Scan
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">terminal</span>
                Python Test Scripts
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SQLMap Tab ── */}
      {activeTab === 'sqlmap' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <span className="material-symbols-outlined text-amber-400 text-[18px] mt-0.5 flex-shrink-0">warning</span>
            <div className="text-[11px] text-text-muted leading-relaxed">
              <span className="font-bold text-amber-400">How it works: </span>
              The backend SSHes into your Kali Linux VM → runs{' '}
              <code className="bg-amber-500/10 text-amber-300 px-1 rounded">sqlmap</code> against the New1 target app →
              {useBurp && <> routes traffic through Burp Suite (port 8080 on Kali) →</>} Suraksha-AI middleware intercepts and blocks the SQLi payloads → you see everything here live.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isScanning ? (
              <button
                onClick={startSQLMap}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[12px] rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                Launch SQLMap on Kali
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[12px] rounded-xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                Stop Scan
              </button>
            )}
            <button
              onClick={clearLogs}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-card-custom border border-border-custom hover:bg-border-custom/30 text-text-muted font-medium text-[12px] rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
              Clear Logs
            </button>
          </div>
        </div>
      )}

      {/* ── Python Scripts Tab ── */}
      {activeTab === 'scripts' && (
        <div className="space-y-3">
          <p className="text-[12px] text-text-muted">
            Select test scripts to upload &amp; execute on Kali Linux. Each script sends payloads
            to the target and Suraksha-AI blocks them. Results stream here live.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_SCRIPTS.map(script => (
              <label
                key={script}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-[11px] font-medium ${
                  selectedScripts.includes(script)
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                    : 'bg-card-custom border-border-custom text-text-muted hover:border-border-custom/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedScripts.includes(script)}
                  onChange={() => toggleScript(script)}
                  className="h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
                />
                <span className="font-mono truncate">{script.replace('test_', '').replace('.py', '')}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isScanning ? (
              <button
                onClick={startScripts}
                disabled={selectedScripts.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[12px] rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                Run {selectedScripts.length} Script{selectedScripts.length !== 1 ? 's' : ''} on Kali
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[12px] rounded-xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                Stop
              </button>
            )}
            <button
              onClick={clearLogs}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-card-custom border border-border-custom hover:bg-border-custom/30 text-text-muted font-medium text-[12px] rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Log Stats Bar ── */}
      {logs.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="text-text-muted">{logStats.total} lines</span>
          <span className="text-emerald-400 font-semibold">{logStats.success} OK</span>
          <span className="text-amber-400">{logStats.warning} warn</span>
          <span className="text-red-400 font-semibold">{logStats.error} err</span>
          {isScanning && (
            <span className="ml-auto flex items-center gap-1.5 text-indigo-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
              streaming...
            </span>
          )}
        </div>
      )}

      {/* ── Terminal Log Window ── */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden">
        {/* Terminal titlebar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] text-[#8b949e] font-mono ml-2">
            suraksha-ai — sqlmap live stream
          </span>
          {isScanning && (
            <span className="ml-auto text-[10px] text-emerald-400 font-mono animate-pulse">● LIVE</span>
          )}
        </div>

        {/* Log lines */}
        <div className="font-mono text-[11px] leading-relaxed p-4 h-72 overflow-y-auto space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-[#6e7681] italic">
              {isScanning
                ? '⏳ Waiting for output...'
                : '▸ Configure SSH settings above and click Launch to start.'}
            </p>
          ) : (
            logs.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 group">
                {entry.ts && (
                  <span className="text-[#6e7681] flex-shrink-0 w-16">{entry.ts}</span>
                )}
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${LEVEL_BADGE[entry.level] || LEVEL_BADGE.INFO}`}>
                  {entry.level}
                </span>
                <span className={`break-all ${LEVEL_STYLE[entry.level] || LEVEL_STYLE.INFO}`}>
                  {entry.msg}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── Architecture Note ── */}
      <div className="flex gap-2 bg-bg-custom/30 border border-border-custom rounded-xl p-3 text-[11px] text-text-muted">
        <span className="material-symbols-outlined text-indigo-400 text-[16px] mt-0.5 flex-shrink-0">info</span>
        <span>
          <b className="text-text-custom">Architecture:</b>{' '}
          React → Flask (port 5000) → SSH → Kali Linux VM → sqlmap/scripts → New1 target (port 4000)
          {useBurp && ' → Burp Suite (port 8080 on Kali)'} → Suraksha-AI WAF intercepts attacks
        </span>
      </div>

    </section>
  );
};

export default SQLMapTestPanel;
