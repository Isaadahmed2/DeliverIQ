import os
import sys
import joblib
import pandas as pd
from typing import Dict, Any, List

try:
    from ml_service.features import extract_features_from_row
except ImportError:
    from features import extract_features_from_row

class RiskInferenceEngine:
    """Production Inference Engine for Pre-Dispatch Delivery Risk Scoring."""
    
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RiskInferenceEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_path: str = None):
        if self._initialized:
            return
            
        if model_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(base_dir, 'models', 'deliveriq_risk_model.joblib')
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Run train.py first.")
            
        bundle = joblib.load(model_path)
        self.model = bundle['model']
        self.feature_names = bundle['feature_names']
        self.metrics = bundle.get('metrics', {})
        self.version = bundle.get('version', '1.0.0-MVP')
        self._initialized = True
        print(f"RiskInferenceEngine loaded (Version: {self.version}, ROC-AUC: {self.metrics.get('roc_auc', 0):.4f})")

    def score_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes raw order dict and returns:
        - score: float (0.0 to 100.0) -> Delivery Safety Probability
        - risk_tier: 'SAFE' | 'MEDIUM' | 'HIGH'
        - rto_probability: float (0.0 to 1.0)
        - risk_factors: List[str]
        - recommended_action: str
        """
        features = extract_features_from_row(order)
        df_feat = pd.DataFrame([features])[self.feature_names]
        
        # P(Delivery Success)
        p_success = float(self.model.predict_proba(df_feat)[0][1])
        score = round(p_success * 100, 1)
        rto_prob = round(1.0 - p_success, 3)
        
        # Risk factor reasoning
        risk_factors: List[str] = []
        if features.get('completeness_score', 1.0) < 0.4:
            risk_factors.append("Address is incomplete (missing house/street/landmarks)")
        if features.get('phone_valid', 1) == 0:
            risk_factors.append("Customer phone number prefix or length is invalid")
        if features.get('is_high_value', 0) == 1:
            risk_factors.append("High COD order value (> PKR 12,000) increases cancellation risk")
        if features.get('city_tier', 1) == 3:
            risk_factors.append("Delivery destination is in a remote / Tier-3 logistics zone")
        if features.get('is_midnight', 0) == 1:
            risk_factors.append("Order placed during midnight hours (high impulse cancel probability)")
        if features.get('is_repeat_customer', 0) == 1:
            risk_factors.append("Positive: Verified repeat buyer history")

        # Determine Tier & Recommended Action
        if score >= 80.0:
            tier = "SAFE"
            action = "DIRECT_DISPATCH"
        elif score >= 50.0:
            tier = "MEDIUM"
            action = "WHATSAPP_CONFIRMATION"
        else:
            tier = "HIGH"
            action = "PARALLEL_WHATSAPP_AND_GEO_LANDMARK"
            
        return {
            "score": score,
            "risk_tier": tier,
            "rto_probability": rto_prob,
            "risk_factors": risk_factors if risk_factors else ["Standard order profile"],
            "recommended_action": action,
            "raw_features": features
        }

if __name__ == '__main__':
    engine = RiskInferenceEngine()
    test_order_safe = {
        'customer_name': 'Ali Khan',
        'customer_phone': '03001234567',
        'shipping_address': 'House #45, Street #12, near Jamia Masjid, Lahore',
        'city': 'Lahore',
        'cod_amount': 2500,
        'order_hour': 15,
        'is_repeat_customer': 1
    }
    print("\n--- SAFE ORDER TEST ---")
    print(engine.score_order(test_order_safe))
    
    test_order_risky = {
        'customer_name': 'Unknown User',
        'customer_phone': '039912345',
        'shipping_address': 'near bridge',
        'city': 'Turbat',
        'cod_amount': 26000,
        'order_hour': 2,
        'is_repeat_customer': 0
    }
    print("\n--- HIGH RISK ORDER TEST ---")
    print(engine.score_order(test_order_risky))
