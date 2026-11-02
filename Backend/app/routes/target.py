import logging
import time
from datetime import datetime
from flask import Blueprint, request
from app.utils.helpers import json_response
from app.extensions import db
from app.models.attack_log import AttackLog
from app.models.live_request import LiveRequest
from app.services.detection_service import DetectionService

logger = logging.getLogger('app')
target_bp = Blueprint('target', __name__)

@target_bp.route('/target/health', methods=['GET'])
def target_health():
    """GET /api/target/health - Status check for target integration service."""
    return json_response(
        success=True,
        message="Target service integration is active.",
        data={
            "status": "online",
            "telemetry_endpoint": "/api/target/telemetry",
            "login_endpoint": "/api/target/login",
            "search_endpoint": "/api/target/search"
        }
    )

@target_bp.route('/target/telemetry', methods=['POST'])
def target_telemetry():
    """
    POST /api/target/telemetry
    Telemetry ingestion endpoint for external target applications (e.g. Testing App / New1 login app).
    Analyzes incoming payload, logs AttackLog and LiveRequest in suraksha.db, and returns decision.
    """
    data = request.get_json() or {}
    source_app = data.get('source_app', 'Testing App')
    url = data.get('url', '/api/login')
    method = data.get('method', 'POST')
    payload = data.get('payload', '')
    client_ip = data.get('client_ip') or request.remote_addr or '127.0.0.1'
    user_agent = data.get('user_agent') or request.headers.get('User-Agent', 'Mozilla/5.0')

    if isinstance(payload, dict):
        payload_str = "&".join([f"{k}={v}" for k, v in payload.items()])
    else:
        payload_str = str(payload)

    analysis = DetectionService.analyze_request(
        url=url,
        payload=payload_str,
        headers=dict(request.headers),
        cookies=dict(request.cookies)
    )

    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    threat_level = analysis.get('threat_level', 'Low')
    reason = analysis.get('reason', 'Normal traffic.')

    # Save to LiveRequest & AttackLog tables
    try:
        live_entry = LiveRequest(
            url=f"[{source_app}] {url}",
            method=method,
            payload=payload_str[:500],
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)

        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url=f"[{source_app}] {url}",
                method=method,
                prediction='SQL Injection',
                threat_level=threat_level,
                payload=payload_str[:1000],
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist telemetry event from {source_app} to database: {str(e)}")

    return json_response(
        success=not is_blocked,
        message="Telemetry evaluated by Suraksha-AI." if not is_blocked else "Threat Intercepted: Request blocked by Suraksha-AI.",
        data={
            "blocked": is_blocked,
            "verdict": "BLOCKED" if is_blocked else "ALLOWED",
            "status_code": 403 if is_blocked else 200,
            "risk_score": risk_score,
            "threat_level": threat_level,
            "reason": reason,
            "source_app": source_app,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=403 if is_blocked else 200
    )


@target_bp.route('/target/login', methods=['POST'])
def target_login():
    """
    POST /api/target/login
    Simulates a target vulnerable authentication endpoint.
    Evaluates incoming credentials using DetectionService, logs attempt to suraksha.db,
    and blocks malicious SQL injection requests.
    """
    data = request.get_json() or {}
    username = str(data.get('username', data.get('email', ''))).strip()
    password = str(data.get('password', '')).strip()
    client_ip = request.remote_addr or '127.0.0.1'
    
    combined_payload = f"username={username}&password={password}"
    
    analysis = DetectionService.analyze_request(
        url='/target/login',
        payload=combined_payload,
        headers=dict(request.headers),
        cookies=dict(request.cookies)
    )
    
    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    severity = analysis.get('threat_level', 'Low')
    explanation = analysis.get('reason', 'No anomalies detected.')
    
    try:
        live_entry = LiveRequest(
            url='/target/login',
            method='POST',
            payload=combined_payload,
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)
        
        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url='/target/login',
                method='POST',
                prediction='SQL Injection',
                threat_level=severity,
                payload=combined_payload,
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist target login event to database: {str(e)}")

    if is_blocked:
        return json_response(
            success=False,
            message="Security Alert: Request blocked by Suraksha-AI Web Application Firewall.",
            data={
                "verdict": "BLOCKED",
                "status_code": 403,
                "threat_level": severity,
                "confidence": risk_score,
                "explanation": explanation,
                "target_endpoint": "/api/target/login",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            status_code=403
        )
        
    if username == "admin" and password == "admin123":
        auth_status = "Authentication Successful! Welcome, Administrator."
    else:
        auth_status = "Authentication Failed: Invalid username or password."
        
    return json_response(
        success=True,
        message="Request evaluated as Safe by Suraksha-AI.",
        data={
            "verdict": "ALLOWED",
            "status_code": 200,
            "threat_level": "Safe",
            "confidence": risk_score,
            "explanation": explanation,
            "auth_response": auth_status,
            "target_endpoint": "/api/target/login",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=200
    )


@target_bp.route('/target/search', methods=['POST'])
def target_search():
    """
    POST /api/target/search
    Simulates a target vulnerable database search/query endpoint.
    """
    data = request.get_json() or {}
    query = str(data.get('query', '')).strip()
    category = str(data.get('category', 'all')).strip()
    client_ip = request.remote_addr or '127.0.0.1'
    
    combined_payload = f"query={query}&category={category}"
    
    analysis = DetectionService.analyze_request(
        url='/target/search',
        payload=combined_payload,
        headers=dict(request.headers),
        cookies=dict(request.cookies)
    )
    
    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    severity = analysis.get('threat_level', 'Low')
    explanation = analysis.get('reason', 'No anomalies detected.')
    
    try:
        live_entry = LiveRequest(
            url='/target/search',
            method='POST',
            payload=combined_payload,
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)
        
        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url='/target/search',
                method='POST',
                prediction='SQL Injection',
                threat_level=severity,
                payload=combined_payload,
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist target search event to database: {str(e)}")

    if is_blocked:
        return json_response(
            success=False,
            message="Security Alert: Query blocked by Suraksha-AI Web Application Firewall.",
            data={
                "verdict": "BLOCKED",
                "status_code": 403,
                "threat_level": severity,
                "confidence": risk_score,
                "explanation": explanation,
                "target_endpoint": "/api/target/search",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            status_code=403
        )
        
    mock_results = [
        {"id": 101, "name": f"Product Result for '{query}'", "category": category, "price": "$49.99", "status": "In Stock"},
        {"id": 102, "name": "Suraksha AI Shield v2.4", "category": "Security", "price": "$199.00", "status": "Active"}
    ]
        
    return json_response(
        success=True,
        message="Search request executed successfully.",
        data={
            "verdict": "ALLOWED",
            "status_code": 200,
            "threat_level": "Safe",
            "confidence": risk_score,
            "explanation": explanation,
            "results": mock_results,
            "target_endpoint": "/api/target/search",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=200
    )

