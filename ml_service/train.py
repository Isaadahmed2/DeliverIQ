import os
import joblib
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, classification_report
from features import prepare_feature_dataframe

def train_risk_model():
    dataset_path = 'ml_service/data/pakistan_orders_synthetic_10k.csv'
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
        
    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    print("Extracting feature vectors...")
    X = prepare_feature_dataframe(df)
    y = df['delivery_success'].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
    
    model = lgb.LGBMClassifier(
        n_estimators=180,
        learning_rate=0.06,
        max_depth=5,
        num_leaves=31,
        random_state=42,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    acc = accuracy_score(y_test, y_pred)
    
    print("\n--- MODEL PERFORMANCE ---")
    print(f"ROC-AUC:  {auc:.4f}")
    print(f"Accuracy: {acc*100:.2f}%\n")
    print(classification_report(y_test, y_pred, target_names=['RTO/Failed (0)', 'Delivered (1)']))
    
    os.makedirs('ml_service/models', exist_ok=True)
    artifact_path = 'ml_service/models/deliveriq_risk_model.joblib'
    
    metadata = {
        'model': model,
        'feature_names': list(X.columns),
        'metrics': {'roc_auc': float(auc), 'accuracy': float(acc)},
        'version': '1.0.0-MVP'
    }
    
    joblib.dump(metadata, artifact_path)
    print(f"Exported model bundle to {artifact_path} successfully!")

if __name__ == '__main__':
    train_risk_model()
