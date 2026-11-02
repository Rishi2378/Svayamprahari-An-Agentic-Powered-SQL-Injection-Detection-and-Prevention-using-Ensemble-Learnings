"""
sqlmap_test.py
==============
Flask Blueprint: /api/sqlmap/*

Provides endpoints to:
  - Configure Kali Linux SSH connection
  - Trigger sqlmap via SSH (with optional Burp Suite proxy)
  - Stream real-time sqlmap output back to the browser via Server-Sent Events (SSE)
  - Trigger the project's Python test scripts
"""

import subprocess
import threading
import queue
import time
import os
import json
try:
    import paramiko
except ImportError:
    paramiko = None
from flask import Blueprint, request, Response, stream_with_context
from app.utils.helpers import json_response

sqlmap_test_bp = Blueprint('sqlmap_test', __name__)

# ─── Global state ────────────────────────────────────────────────────────────
_log_queue   = queue.Queue()   # Holds log lines for SSE streaming
_scan_active = False           # Is a scan currently running?
_scan_result = {}              # Last scan summary


# ─── Helper: push a log line into the queue ───────────────────────────────────
def _push_log(line: str, level: str = "INFO"):
    _log_queue.put(json.dumps({
        "ts":    time.strftime("%H:%M:%S"),
        "level": level,
        "msg":   line.rstrip()
    }))


# ─── SSH → Kali: run sqlmap ───────────────────────────────────────────────────
def _run_sqlmap_via_ssh(ssh_host: str, ssh_port: int, ssh_user: str,
                        ssh_password: str, target_url: str,
                        burp_proxy: str, extra_args: str):
    """
    Connects to the Kali Linux VM over SSH and streams sqlmap output
    back through the global log queue.
    """
    global _scan_active, _scan_result

    _scan_active = True
    _scan_result = {}

    try:
        if paramiko is None:
            _push_log("❌ paramiko library is not installed in the backend environment. Please run: pip install paramiko", "ERROR")
            _scan_result = {"status": "error", "message": "paramiko library not installed"}
            _scan_active = False
            return

        _push_log(f"🔌 Connecting to Kali Linux VM at {ssh_host}:{ssh_port}...", "INFO")

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=ssh_host,
            port=ssh_port,
            username=ssh_user,
            password=ssh_password,
            timeout=15,
            banner_timeout=20
        )
        _push_log(f"✅ SSH connected to Kali Linux ({ssh_user}@{ssh_host})", "SUCCESS")

        # Build sqlmap command
        proxy_flag = f"--proxy={burp_proxy}" if burp_proxy else ""
        
        # Determine whether target is raw base URL or endpoint
        scan_target = target_url.strip()
        if not scan_target.endswith('/api/login') and not scan_target.endswith('/api/target/login'):
            login_endpoint = f"{scan_target.rstrip('/')}/api/login"
        else:
            login_endpoint = scan_target
        post_data = '--data="email=admin@antigravity.io&password=password123"'

        # Full SQLMap invocation
        sqlmap_core = (
            f"sqlmap -u \"{login_endpoint}\" "
            f"{post_data} "
            f"--batch --level=2 --risk=2 "
            f"--technique=BEUSTQ "
            f"--dbms=sqlite "
            f"--threads=2 "
            f"--ignore-code=401 "
            f"--output-dir=/tmp/sqlmap_suraksha "
            f"{proxy_flag} "
            f"{extra_args}"
        ).strip()

        _push_log(f"🚀 Executing: {sqlmap_core}", "INFO")

        # Spawn a visible graphical window on Kali desktop.
        # Uses DISPLAY=:0 and user Xauthority, supporting xfce4-terminal, qterminal, gnome-terminal, or xterm
        gui_launch_cmd = (
            f"export DISPLAY=:0; "
            f"export XAUTHORITY=/home/{ssh_user}/.Xauthority; "
            f"which xfce4-terminal >/dev/null 2>&1 && (xfce4-terminal --title='Suraksha-AI SQLMap Scanner' --hold -e '{sqlmap_core}' &) "
            f"|| which qterminal >/dev/null 2>&1 && (qterminal -e '{sqlmap_core}' &) "
            f"|| which gnome-terminal >/dev/null 2>&1 && (gnome-terminal -- {sqlmap_core} &) "
            f"|| which xterm >/dev/null 2>&1 && (xterm -title 'Suraksha-AI SQLMap Scanner' -hold -e '{sqlmap_core}' &)"
        )

        try:
            stdin_g, stdout_g, stderr_g = client.exec_command(gui_launch_cmd)
            g_err = stderr_g.read().decode('utf-8', errors='ignore').strip()
            if g_err:
                _push_log(f"🖥️ Desktop notice: {g_err}", "WARNING")
            else:
                _push_log("🖥️ Opened SQLMap terminal window on Kali desktop screen!", "SUCCESS")
        except Exception as e_gui:
            _push_log(f"Notice: Kali GUI terminal launch notice: {e_gui}", "INFO")

        # Open an interactive shell channel to also stream live logs to web dashboard
        cmd = f"{sqlmap_core} 2>&1"
        transport = client.get_transport()
        channel = transport.open_session()
        channel.get_pty()
        channel.exec_command(cmd)

        # Stream stdout line by line
        buffer = ""
        while not channel.exit_status_ready() or channel.recv_ready():
            if channel.recv_ready():
                chunk = channel.recv(4096).decode("utf-8", errors="replace")
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines[-1]            # Keep incomplete line
                for line in lines[:-1]:
                    if line.strip():
                        # Classify log level by content
                        if any(k in line for k in ["[WARNING]", "WARNING"]):
                            _push_log(line, "WARNING")
                        elif any(k in line for k in ["[CRITICAL]", "[ERROR]", "ERROR"]):
                            _push_log(line, "ERROR")
                        elif any(k in line for k in ["[INFO]", "injected", "payload", "retrieved"]):
                            _push_log(line, "SUCCESS")
                        else:
                            _push_log(line, "INFO")
            else:
                time.sleep(0.1)

        exit_code = channel.recv_exit_status()
        client.close()

        _push_log(f"🏁 sqlmap finished with exit code: {exit_code}", "INFO")
        _scan_result = {
            "completed": True,
            "exit_code": exit_code,
            "target": target_url
        }

    except paramiko.AuthenticationException:
        _push_log("❌ SSH Authentication failed. Check Kali username/password.", "ERROR")
    except paramiko.NoValidConnectionsError as e:
        _push_log(f"❌ Cannot connect to Kali VM: {e}. Is the VM running and SSH enabled?", "ERROR")
    except Exception as e:
        _push_log(f"❌ Unexpected error: {str(e)}", "ERROR")
    finally:
        _scan_active = False
        _push_log("--- [SCAN COMPLETE] ---", "INFO")


# ─── SSH → Kali: run Python test scripts ──────────────────────────────────────
def _run_python_scripts_via_ssh(ssh_host: str, ssh_port: int,
                                 ssh_user: str, ssh_password: str,
                                 target_url: str, scripts: list):
    """
    Copies and executes the project Python test scripts on Kali Linux via SSH.
    """
    global _scan_active
    _scan_active = True

    try:
        _push_log(f"🔌 Connecting to Kali Linux for Python test scripts...", "INFO")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ssh_host, port=ssh_port, username=ssh_user,
                       password=ssh_password, timeout=15)
        _push_log("✅ SSH connected.", "SUCCESS")

        # Ensure dependencies (requests, faker) are available on Kali
        _push_log("📦 Verifying Python dependencies on Kali Linux...", "INFO")
        dep_cmd = "python3 -c 'import requests; from faker import Faker' 2>&1"
        _, stdout_dep, _ = client.exec_command(dep_cmd)
        dep_err = stdout_dep.read().decode('utf-8', errors='ignore')
        
        if "ModuleNotFoundError" in dep_err or "No module named" in dep_err:
            _push_log("⬇ Installing missing packages (requests, faker) on Kali Linux...", "WARNING")
            install_cmd = "pip install requests faker --break-system-packages -q 2>&1 || pip3 install requests faker -q 2>&1 || sudo apt-get update && sudo apt-get install -y python3-requests python3-faker -q 2>&1"
            _, inst_out, _ = client.exec_command(install_cmd)
            inst_out.channel.recv_exit_status()
            _push_log("✅ Python dependencies ready.", "SUCCESS")
        else:
            _push_log("✅ All required Python packages found on Kali.", "SUCCESS")

        # Base directory of the project on Windows (Backend/app/routes -> 3 levels up is project root)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

        for script_name in scripts:
            script_path = os.path.join(project_root, script_name)
            if not os.path.exists(script_path):
                # Also check in project_root/scripts or tests if applicable
                alt_path = os.path.join(project_root, 'Backend', 'scripts', script_name)
                if os.path.exists(alt_path):
                    script_path = alt_path
                else:
                    _push_log(f"⚠️  Script not found locally: {script_name} (checked {script_path})", "WARNING")
                    continue

            _push_log(f"📤 Uploading {script_name} to Kali Linux...", "INFO")
            sftp = client.open_sftp()
            remote_path = f"/tmp/{script_name}"
            sftp.put(script_path, remote_path)
            sftp.close()

            _push_log(f"▶  Running: python3 {script_name} (target={target_url})", "INFO")
            login_target = f"{target_url.rstrip('/')}/api/login"
            
            # Run test script directly inside remote shell, capturing all output in real time
            run_cmd = f"python3 {remote_path} --url {login_target} 2>&1"
            channel = client.get_transport().open_session()
            channel.get_pty()
            channel.exec_command(run_cmd)

            buffer = ""
            while not channel.exit_status_ready() or channel.recv_ready():
                if channel.recv_ready():
                    chunk = channel.recv(4096).decode("utf-8", errors="replace")
                    buffer += chunk
                    lines = buffer.split("\n")
                    buffer = lines[-1]
                    for line in lines[:-1]:
                        if line.strip():
                            if any(k in line for k in ["BLOCKED", "403", "PASS"]):
                                _push_log(line, "SUCCESS")
                            elif any(k in line for k in ["ERROR", "Traceback", "failed"]):
                                _push_log(line, "ERROR")
                            else:
                                _push_log(line, "INFO")
                else:
                    time.sleep(0.05)

            script_exit = channel.recv_exit_status()
            channel.close()
            _push_log(f"✅ Finished: {script_name} (exit code: {script_exit})", "SUCCESS" if script_exit == 0 else "WARNING")

        client.close()

    except Exception as e:
        _push_log(f"❌ Script execution error: {str(e)}", "ERROR")
    finally:
        _scan_active = False
        _push_log("--- [TEST SCRIPTS COMPLETE] ---", "INFO")


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@sqlmap_test_bp.route('/sqlmap/test-connection', methods=['POST'])
def test_connection():
    """
    POST /api/sqlmap/test-connection
    Tests SSH connectivity to the provided Kali Linux host and port.
    Returns clear diagnostic guidance if the host is unreachable (e.g. NAT IP 10.0.2.15).
    """
    if paramiko is None:
        return json_response(
            success=False,
            message="paramiko library is not installed in the backend.",
            status_code=500
        )

    body = request.get_json() or {}
    ssh_host = body.get("ssh_host", "").strip()
    ssh_port = int(body.get("ssh_port", 22))
    ssh_user = body.get("ssh_user", "kali").strip()
    ssh_password = body.get("ssh_password", "kali")

    if not ssh_host:
        return json_response(
            success=False,
            message="Please provide a VM IP address.",
            status_code=400
        )

    # Special check: VirtualBox default NAT address
    if ssh_host == "10.0.2.15":
        return json_response(
            success=False,
            message="10.0.2.15 is a VirtualBox internal NAT IP and cannot be reached from Windows directly. Please use VirtualBox Port Forwarding (Host: 127.0.0.1, Port: 2222 -> Guest: 22) or switch your network adapter to Host-Only / Bridged.",
            data={"suggestion": "port_forwarding", "recommended_host": "127.0.0.1", "recommended_port": 2222},
            status_code=400
        )

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            hostname=ssh_host,
            port=ssh_port,
            username=ssh_user,
            password=ssh_password,
            timeout=5
        )
        _, stdout, _ = client.exec_command("whoami")
        who = stdout.read().decode().strip()
        client.close()
        return json_response(
            success=True,
            message=f"SSH Connection Verified! Connected to Kali Linux as user '{who}'.",
            data={"connected": True, "user": who, "host": ssh_host, "port": ssh_port}
        )
    except paramiko.AuthenticationException:
        return json_response(
            success=False,
            message=f"Authentication failed for user '{ssh_user}'. Please verify your Kali Linux username and password.",
            status_code=401
        )
    except Exception as e:
        err_msg = str(e)
        if "timed out" in err_msg.lower():
            hint = f"Connection to {ssh_host}:{ssh_port} timed out. Verify that the VM is powered on and the IP is reachable from Windows."
        elif "connection refused" in err_msg.lower():
            hint = f"Connection refused on {ssh_host}:{ssh_port}. Make sure SSH service is running inside Kali (run: sudo systemctl start ssh)."
        else:
            hint = f"Failed to connect to {ssh_host}:{ssh_port} - {err_msg}"
        return json_response(
            success=False,
            message=hint,
            status_code=502
        )


@sqlmap_test_bp.route('/sqlmap/start', methods=['POST'])
def start_sqlmap():
    """
    POST /api/sqlmap/start
    Body JSON:
    {
        "ssh_host":     "192.168.x.x",   // Kali Linux VM IP
        "ssh_port":     22,
        "ssh_user":     "kali",
        "ssh_password": "kali",
        "target_url":   "http://HOST_IP:4000/api/login",
        "burp_proxy":   "http://127.0.0.1:8080",   // optional
        "extra_args":   ""                          // optional extra sqlmap flags
    }
    """
    global _scan_active

    if _scan_active:
        return json_response(success=False, message="A scan is already running.", status_code=409)

    body        = request.get_json() or {}
    ssh_host    = body.get("ssh_host", "")
    ssh_port    = int(body.get("ssh_port", 22))
    ssh_user    = body.get("ssh_user", "kali")
    ssh_password= body.get("ssh_password", "kali")
    target_url  = body.get("target_url", "http://10.0.2.2:4000/api/login")
    burp_proxy  = body.get("burp_proxy", "")
    extra_args  = body.get("extra_args", "")

    if not ssh_host:
        return json_response(success=False,
                             message="ssh_host is required (Kali VM IP address).",
                             status_code=400)

    # Run sqlmap in a background thread so this endpoint returns immediately
    t = threading.Thread(
        target=_run_sqlmap_via_ssh,
        args=(ssh_host, ssh_port, ssh_user, ssh_password,
              target_url, burp_proxy, extra_args),
        daemon=True
    )
    t.start()

    return json_response(
        success=True,
        message="sqlmap scan started. Connect to /api/sqlmap/stream for live logs.",
        data={"target": target_url, "kali_host": ssh_host}
    )


@sqlmap_test_bp.route('/sqlmap/run-scripts', methods=['POST'])
def run_scripts():
    """
    POST /api/sqlmap/run-scripts
    Body JSON:
    {
        "ssh_host":     "192.168.x.x",
        "ssh_port":     22,
        "ssh_user":     "kali",
        "ssh_password": "kali",
        "target_url":   "http://HOST_IP:4000",
        "scripts":      ["test_auth_bypass.py", "test_boolean_sqli.py", ...]
    }
    """
    global _scan_active

    if _scan_active:
        return json_response(success=False, message="A scan is already running.", status_code=409)

    body         = request.get_json() or {}
    ssh_host     = body.get("ssh_host", "")
    ssh_port     = int(body.get("ssh_port", 22))
    ssh_user     = body.get("ssh_user", "kali")
    ssh_password = body.get("ssh_password", "kali")
    target_url   = body.get("target_url", "http://10.0.2.2:4000")
    scripts      = body.get("scripts", [
        "test_auth_bypass.py", "test_boolean_sqli.py",
        "test_tautology_sqli.py", "test_union_sqli.py",
        "test_error_sqli.py", "test_time_sqli.py",
        "test_stacked_sqli.py"
    ])

    if not ssh_host:
        return json_response(success=False,
                             message="ssh_host is required.",
                             status_code=400)

    t = threading.Thread(
        target=_run_python_scripts_via_ssh,
        args=(ssh_host, ssh_port, ssh_user, ssh_password, target_url, scripts),
        daemon=True
    )
    t.start()

    return json_response(
        success=True,
        message="Python test scripts dispatched to Kali Linux.",
        data={"scripts": scripts, "target": target_url}
    )


@sqlmap_test_bp.route('/sqlmap/stop', methods=['POST'])
def stop_scan():
    """POST /api/sqlmap/stop — Marks scan as stopped (SSH process continues to completion)."""
    global _scan_active
    _scan_active = False
    _push_log("🛑 Stop requested by operator.", "WARNING")
    return json_response(success=True, message="Stop signal sent.")


@sqlmap_test_bp.route('/sqlmap/status', methods=['GET'])
def scan_status():
    """GET /api/sqlmap/status — Returns current scan state."""
    return json_response(
        success=True,
        message="Scan status retrieved.",
        data={
            "active": _scan_active,
            "result": _scan_result
        }
    )


@sqlmap_test_bp.route('/sqlmap/stream', methods=['GET'])
def stream_logs():
    """
    GET /api/sqlmap/stream
    Server-Sent Events (SSE) endpoint.
    The React frontend connects here and receives log lines in real-time.
    """
    def generate():
        yield "data: {\"ts\":\"\",\"level\":\"INFO\",\"msg\":\"🔗 Log stream connected. Waiting for scan...\"}\n\n"
        while True:
            try:
                # Block for up to 1 second; yields keepalive comment if empty
                log_line = _log_queue.get(timeout=1)
                yield f"data: {log_line}\n\n"
            except queue.Empty:
                # Send SSE keepalive comment to prevent proxy timeout
                yield ": keepalive\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )
