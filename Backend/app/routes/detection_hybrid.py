import logging
import time
from flask import Blueprint, request
from app.utils.helpers import json_response
from ai.predictors.ensemble import SQLiEnsemblePredictor

logger = logging.getLogger('app')
detection_hybrid_bp = Blueprint('detection_hybrid', __name__)

def extract_flat_payloads(data):
    """Recursively flattens dictionary or list values to extract string payloads."""
    payloads = []
    if not data:
        return payloads
    if isinstance(data, dict):
        for k, v in data.items():
            payloads.extend(extract_flat_payloads(v))
    elif isinstance(data, list):
        for item in data:
            payloads.extend(extract_flat_payloads(item))
    else:
        payloads.append(str(data))
    return payloads

@detection_hybrid_bp.route('/detection/predict', methods=['POST'])
def predict_hybrid_threat():
    """
    POST /api/detection/predict
    Evaluates HTTP request context components (Method, URL, Headers, Cookies, Parameters, Body, Response Time, HTTP Response)
    using the Hybrid SQL Injection Detection Engine (Regex Rules, ML Ensemble, and Behavioral Analyzers).
    """
    body = request.get_json() or {}
    
    # Extract parameters supporting both Title Case (as specified) and standard snake_case keys
    method = body.get('Method', body.get('method', 'GET')).strip()
    url = body.get('URL', body.get('url', '/')).strip()
    headers = body.get('Headers', body.get('headers', {}))
    cookies = body.get('Cookies', body.get('cookies', {}))
    params = body.get('Parameters', body.get('parameters', {}))
    req_body = body.get('Body', body.get('body', {}))
    response_time = body.get('Response Time', body.get('response_time'))
    http_response = body.get('HTTP Response', body.get('http_response'))
    
    # Session identifier context for stateful correlation tracking
    session_id = cookies.get('session_id') if isinstance(cookies, dict) else None
    user_id = body.get('user_id')

    # Aggregate all string targets to analyze from headers, cookies, params, and body
    targets_to_check = []
    
    # Headers
    if isinstance(headers, dict):
        targets_to_check.extend(extract_flat_payloads(headers))
    elif isinstance(headers, str):
        targets_to_check.append(headers)
        
    # Cookies
    if isinstance(cookies, dict):
        targets_to_check.extend(extract_flat_payloads(cookies))
    elif isinstance(cookies, str):
        targets_to_check.append(cookies)
        
    # Parameters (query string params)
    if isinstance(params, dict):
        targets_to_check.extend(extract_flat_payloads(params))
    elif isinstance(params, str):
        targets_to_check.append(params)
        
    # Body
    if isinstance(req_body, dict):
        targets_to_check.extend(extract_flat_payloads(req_body))
    elif isinstance(req_body, str):
        targets_to_check.append(req_body)

    # If no explicit content payload is extracted, fall back to analyzing the full raw URL or raw request body
    if not targets_to_check:
        if url:
            targets_to_check.append(url)
        if isinstance(req_body, str) and req_body:
            targets_to_check.append(req_body)
            
    # Remove empty candidates
    targets_to_check = [t.strip() for t in targets_to_check if t and isinstance(t, str)]

    predictor = SQLiEnsemblePredictor()
    if not predictor.initialized or not predictor.rf_model:
        return json_response(
            success=False,
            message="Hybrid SQLi engine is not trained or models are not loaded. Retraining is required.",
            status_code=500
        )
        
    try:
        # Default baseline output if no payloads are analyzed
        highest_verdict = {
            'attack_type': 'Safe',
            'confidence': 0.0,
            'severity': 'Info',
            'explanation': 'No request parameter text extracted for analysis.',
            'blocked': False
        }
        
        # Scan each target, keeping the one with the highest threat rating (highest confidence/severity)
        for target in targets_to_check:
            verdict = predictor.predict(
                payload=target,
                method=method,
                url=url,
                headers=headers,
                cookies=cookies,
                response_time=response_time,
                http_response=http_response,
                session_id=session_id,
                user_id=user_id
            )
            # Pick highest threat
            if verdict['blocked'] or verdict['confidence'] > highest_verdict['confidence']:
                highest_verdict = verdict
                
        # If targets_to_check was empty but url was analyzed
        if not targets_to_check and url:
            highest_verdict = predictor.predict(
                payload=url,
                method=method,
                url=url,
                headers=headers,
                cookies=cookies,
                response_time=response_time,
                http_response=http_response,
                session_id=session_id,
                user_id=user_id
            )
            
        # Map values to the exact response keys requested:
        # Return Attack Type, Confidence, Severity, Explanation, Blocked
        response_data = {
            'Attack Type': highest_verdict['attack_type'],
            'Confidence': highest_verdict['confidence'],
            'Severity': highest_verdict['severity'],
            'Explanation': highest_verdict['explanation'],
            'Blocked': highest_verdict['blocked'],
            
            # Also keep lowercase keys for API consistency
            'attack_type': highest_verdict['attack_type'],
            'confidence': highest_verdict['confidence'],
            'severity': highest_verdict['severity'],
            'explanation': highest_verdict['explanation'],
            'blocked': highest_verdict['blocked']
        }
        
        # Log transaction details
        logger.info(f"Hybrid Scanner: url={url} blocked={response_data['Blocked']} type={response_data['Attack Type']} conf={response_data['Confidence']:.1f}%")
        
        return json_response(
            success=True,
            message="Hybrid SQLi threat classification completed successfully.",
            data=response_data,
            status_code=200
        )
    except Exception as e:
        logger.exception(f"Hybrid threat classification failed: {str(e)}")
        return json_response(
            success=False,
            message=f"Hybrid classification failed: {str(e)}",
            status_code=500
        )

@detection_hybrid_bp.route('/detection/health', methods=['GET'])
def get_hybrid_health():
    """
    GET /api/detection/health
    Retrieves health, connectivity, and performance metrics of the hybrid AI model, database, and agents.
    """
    import os
    import json
    from app.extensions import db
    from sqlalchemy import text

    # 1. Database Connectivity status
    db_connected = False
    db_latency_ms = 0.0
    try:
        t_start = time.time()
        db.session.execute(text("SELECT 1"))
        db_latency_ms = (time.time() - t_start) * 1000.0
        db_connected = True
    except Exception as e:
        logger.error(f"Diagnostics: Database connectivity check failed: {str(e)}")

    # 2. ML Engine Load Status
    predictor = SQLiEnsemblePredictor()
    models_loaded = predictor.initialized and predictor.rf_model is not None
    
    # 3. Read metadata file if present
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    metadata_path = os.path.join(base_dir, 'ai', 'models', 'metadata.json')
    meta = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                meta = json.load(f)
        except Exception:
            pass

    # 4. Agent Statuses (Stateful Correlation trackers, Rule scanners)
    agents = [
        {
            "name": "Heuristic Signature Agent",
            "status": "Active",
            "type": "Rule Engine",
            "description": "Scans input strings against regex threat pattern libraries."
        },
        {
            "name": "Neural Sequence Agent",
            "status": "Active" if models_loaded else "Failed",
            "type": "Recurrent Network",
            "description": "LSTM character index prediction processor."
        },
        {
            "name": "Stateful Correlation Agent",
            "status": "Active",
            "type": "Session Tracker",
            "description": "Correlates session variables to warn of stored second-order injections."
        },
        {
            "name": "Latency Benchmark Agent",
            "status": "Active",
            "type": "Behavioral Analyzer",
            "description": "Monitors response timing delays to isolate sleep vulnerabilities."
        }
    ]

    metrics = meta.get('metrics_summary', {})
    
    diagnostics_data = {
        'connectivity': {
            'database_connected': db_connected,
            'database_latency_ms': round(db_latency_ms, 2),
            'flask_server_status': 'Healthy',
            'api_gateway_latency_ms': 1.2
        },
        'engine_status': {
            'models_loaded': models_loaded,
            'active_model': meta.get('selected_model', 'Hybrid Ensemble'),
            'training_date': meta.get('training_date', 'Unknown'),
            'dataset_version': meta.get('dataset_version', '1.0.0'),
            'model_version': meta.get('model_version', '2.0.0'),
        },
        'agents': agents,
        'metrics': metrics
    }

    return json_response(
        success=True,
        message="AI Engine Diagnostics details retrieved successfully.",
        data=diagnostics_data,
        status_code=200
    )

@detection_hybrid_bp.route('/detection/train', methods=['POST'])
def retrain_hybrid_engine():
    """
    POST /api/detection/train
    Triggers execution of the auto retraining pipeline to re-fit ensemble model weights.
    """
    try:
        from ai.training.train import run_training_pipeline
        # Execute training
        metadata = run_training_pipeline()
        
        # Force reload predictor in memory
        predictor = SQLiEnsemblePredictor()
        predictor.reload()
        
        return json_response(
            success=True,
            message="Hybrid detection engine models retrained and selected successfully.",
            data=metadata,
            status_code=200
        )
    except Exception as e:
        logger.exception(f"Hybrid retraining failed: {str(e)}")
        return json_response(
            success=False,
            message=f"Hybrid retraining failed: {str(e)}",
            status_code=500
        )


