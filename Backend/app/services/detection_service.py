import logging
from ai.predictors.ensemble import SQLiEnsemblePredictor
from ai.utils.rule_engine import SQLiRuleEngine

logger = logging.getLogger('app')

class DetectionService:
    """
    Production-ready classification pipeline service, checking requests 
    for SQLi threat vectors using the advanced Hybrid ML Ensemble and Signature Rule Engine.
    """

    @staticmethod
    def analyze_request(url, payload, headers, cookies):
        """
        Evaluates incoming request details using the SQLi Detection engine.
        Returns a dictionary containing risk_score, confidence, prediction, threat_level, and reason.
        """
        predictor = SQLiEnsemblePredictor()
        
        # Check if hybrid ML models are initialized and loaded
        if not predictor.initialized or not predictor.rf_model:
            # Active Signature Fallback: Use SQLiRuleEngine for accurate pattern matching
            rule_engine = predictor.rule_engine if hasattr(predictor, 'rule_engine') else SQLiRuleEngine()
            eval_res = rule_engine.evaluate(payload or url or "")
            
            score = eval_res['rule_score']
            is_blocked = score >= 50.0 or len(eval_res['matches']) > 0
            
            if score >= 85.0:
                threat_level = "Critical"
            elif score >= 65.0:
                threat_level = "High"
            elif score >= 50.0:
                threat_level = "Medium"
            else:
                threat_level = "Low"
                
            matches_str = ", ".join(eval_res['matches']) if eval_res['matches'] else "No known signatures"
            reason = f"Signature Match [{eval_res['inferred_type']}]: {matches_str}" if is_blocked else "No malicious patterns detected."
            
            return {
                "risk_score": score,
                "confidence": max(score, 90.0) if is_blocked else 95.0,
                "prediction": "SQL Injection" if is_blocked else "Safe",
                "threat_level": threat_level,
                "reason": reason,
                "blocked": is_blocked,
                "matches": eval_res['matches'],
                "inferred_type": eval_res['inferred_type']
            }

        try:
            # Run hybrid ML prediction
            verdict = predictor.predict(
                payload=payload or "",
                url=url or "/",
                headers=headers or {},
                cookies=cookies or {}
            )
            
            return {
                "risk_score": verdict['confidence'],
                "confidence": verdict['confidence'],
                "prediction": "SQL Injection" if verdict['blocked'] else "Safe",
                "threat_level": "Low" if not verdict['blocked'] else ("Medium" if verdict['severity'] == "Medium" else "Critical"),
                "reason": verdict['explanation'],
                "blocked": verdict['blocked']
            }
        except Exception as e:
            logger.error(f"DetectionService: Hybrid analysis execution failed: {str(e)}")
            # Fallback to pure rule engine on error
            rule_engine = SQLiRuleEngine()
            eval_res = rule_engine.evaluate(payload or "")
            score = eval_res['rule_score']
            is_blocked = score >= 50.0
            return {
                "risk_score": score,
                "confidence": 80.0,
                "prediction": "SQL Injection" if is_blocked else "Safe",
                "threat_level": "Critical" if score > 80 else ("Medium" if is_blocked else "Low"),
                "reason": f"Fallback Rule Engine: {str(e)}",
                "blocked": is_blocked
            }

