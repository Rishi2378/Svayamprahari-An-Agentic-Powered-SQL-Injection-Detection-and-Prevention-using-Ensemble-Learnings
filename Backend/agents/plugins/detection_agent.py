import time
import logging
from agents.base.base_agent import BaseAgent
from ai.predictors.ensemble import SQLiEnsemblePredictor

logger = logging.getLogger('app')

class DetectionAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(
            agent_name="VulnerabilityDetectionAgent",
            agent_type="detection_agent",
            version="1.0.0",
            **kwargs
        )
        self.predictor = None

    def initialize(self):
        super().initialize()
        # Cache loaded ML ensemble model
        try:
            self.predictor = SQLiEnsemblePredictor()
            logger.info("[DetectionAgent] Cached SQLiEnsemblePredictor successfully loaded.")
        except Exception as e:
            logger.error(f"[DetectionAgent] Failed to load ensemble model predictor: {str(e)}")
            self.status = "Failed"

    def execute(self, message):
        payload = message.payload
        task = payload.get("task")
        
        if task == "detect_threat":
            request_data = payload.get("request", {})
            transaction_id = payload.get("transaction_id")
            client_ip = payload.get("client_ip", "127.0.0.1")
            freq = payload.get("request_frequency", 1)
            
            # Extract request targets to inspect
            method = request_data.get("method", "GET")
            url = request_data.get("url", "/")
            headers = request_data.get("headers", {})
            cookies = request_data.get("cookies", {})
            params = request_data.get("parameters", {})
            body = request_data.get("body", {})
            response_time = request_data.get("response_time")
            http_response = request_data.get("http_response")
            
            # Aggregate payload targets
            targets = []
            if isinstance(body, dict):
                targets.extend(body.values())
            elif isinstance(body, str):
                targets.append(body)
                
            if isinstance(params, dict):
                targets.extend(params.values())
            elif isinstance(params, str):
                targets.append(params)
                
            if isinstance(cookies, dict):
                targets.extend(cookies.values())
                
            # Fallback to URL if empty
            if not targets:
                targets.append(url)
                
            highest_threat = {
                "attack_type": "Safe",
                "confidence": 0.0,
                "severity": "Info",
                "explanation": "No vulnerability indicators discovered.",
                "blocked": False
            }
            
            # Evaluate using existing hybrid engine
            if self.predictor:
                for target in targets:
                    if not isinstance(target, str) or not target:
                        continue
                    try:
                        verdict = self.predictor.predict(
                            payload=target,
                            method=method,
                            url=url,
                            headers=headers,
                            cookies=cookies,
                            response_time=response_time,
                            http_response=http_response
                        )
                        if verdict["confidence"] > highest_threat["confidence"]:
                            highest_threat = verdict
                    except Exception as e:
                        logger.error(f"[DetectionAgent] Prediction crash: {str(e)}")
            
            # Log to local agent memory
            self.memory.add_payload_log(str(targets), highest_threat["attack_type"])
            
            logger.info(f"[DetectionAgent] Classification complete: Type={highest_threat['attack_type']}, Conf={highest_threat['confidence']}%")
            
            # Forward threat metrics to Threat Intel Agent
            self.send(
                receiver="threat_intel_agent",
                payload={
                    "task": "evaluate_campaign",
                    "transaction_id": transaction_id,
                    "request": request_data,
                    "client_ip": client_ip,
                    "request_frequency": freq,
                    "detection_metrics": {
                        "attack_type": highest_threat["attack_type"],
                        "confidence": highest_threat["confidence"],
                        "severity": highest_threat["severity"],
                        "explanation": highest_threat["explanation"]
                    },
                    "timestamp": time.time()
                },
                priority="High"
            )

        elif task == "evaluate_model_performance":
            logger.info("[DetectionAgent] Running scheduled model performance verification.")
            # Trigger metadata read verification
            if self.predictor:
                self.predictor.reload()
