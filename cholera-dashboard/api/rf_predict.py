"""Random Forest API using the shared CholeraPredictionPipeline.

Single model (rf_model.joblib + feature_columns.joblib) for:
- Batch CSV predictions (cholera_pipeline.py)
- Live API predictions and forecasts
- Supabase-backed cleaned dataset for the frontend
"""
import os
import sys
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
import requests

# Project root = parent of cholera-dashboard (parent of api)
_API_DIR = os.path.dirname(os.path.abspath(__file__))
_CHOLERA_DASHBOARD = os.path.dirname(_API_DIR)
_CHOLERA_ROOT = os.path.dirname(_CHOLERA_DASHBOARD)
if _CHOLERA_ROOT not in sys.path:
    sys.path.insert(0, _CHOLERA_ROOT)

try:
    from cholera_pipeline import CholeraPredictionPipeline
except ImportError:
    try:
        from pipeline_rf import CholeraPredictionPipeline
    except ImportError:
        CholeraPredictionPipeline = None

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    app = Flask(__name__)
    CORS(app)
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    app = None


def _find_path(filename):
    """Locate a file in api/, cholera-dashboard/, or project root."""
    for base in [_API_DIR, _CHOLERA_DASHBOARD, _CHOLERA_ROOT]:
        p = os.path.join(base, filename)
        if os.path.isfile(p):
            return p
    try:
        cwd = os.getcwd()
        for base in [cwd, os.path.dirname(cwd)]:
            p = os.path.join(base, filename)
            if os.path.isfile(p):
                return p
    except Exception:
        pass
    return os.path.join(_CHOLERA_ROOT, filename)


RF_MODEL_PATH = _find_path("rf_model.joblib")
FEATURE_COLUMNS_PATH = _find_path("feature_columns.joblib")

# Supabase configuration for backend-side access
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Global pipeline (load once)
_pipeline = None
_pipeline_loaded = False


def load_pipeline():
    """Load RF model and feature columns via CholeraPredictionPipeline."""
    global _pipeline, _pipeline_loaded
    if _pipeline_loaded and _pipeline is not None:
        return _pipeline
    if CholeraPredictionPipeline is None:
        print(
            "[WARNING] CholeraPredictionPipeline not found. "
            "Run from repo root or add root to PYTHONPATH."
        )
        return None
    if not os.path.exists(RF_MODEL_PATH) or not os.path.exists(FEATURE_COLUMNS_PATH):
        print(
            f"[WARNING] RF model or features not found: "
            f"{RF_MODEL_PATH}, {FEATURE_COLUMNS_PATH}"
        )
        return None
    try:
        _pipeline = CholeraPredictionPipeline(
            model_path=RF_MODEL_PATH,
            feature_path=FEATURE_COLUMNS_PATH,
        )
        _pipeline_loaded = True
        print(f"[OK] RF pipeline loaded (model={RF_MODEL_PATH})")
        return _pipeline
    except Exception as e:
        print(f"[ERROR] Loading pipeline: {e}")
        import traceback
        traceback.print_exc()
        return None


def _request_to_dataframe(data):
    """
    Build a one-row DataFrame with columns expected by CholeraPredictionPipeline:
    Region, District, TL, TR, reporting_date, deaths, CFR, confidence_weight, cCh, sCh.
    """
    date_str = data.get('date') or datetime.now().strftime('%Y-%m-%d')
    try:
        current_date = pd.Timestamp(date_str[:10])
    except Exception:
        current_date = pd.Timestamp.now()

    region = (data.get('region') or 'Central').strip()
    district = (data.get('district') or '').strip()
    deaths = float(data.get('deaths', 0) or 0)
    cfr = float(data.get('CFR', 0) or 0)
    confidence_weight = float(data.get('confidence_weight', 1) or 1)
    # For prediction we don't have current cCh/sCh; use 0 (pipeline will compute logs)
    cCh = float(data.get('cCh', 0) or 0)
    sCh = float(data.get('sCh', 0) or 0)

    row = pd.DataFrame([{
        'Region': region,
        'District': district,
        'TL': current_date,
        'TR': current_date,
        'reporting_date': current_date,
        'deaths': deaths,
        'CFR': cfr,
        'confidence_weight': confidence_weight,
        'cCh': cCh,
        'sCh': sCh,
    }])
    return row


def predict_one_row(data, historical_data=None):
    """
    Run pipeline on a single row from API request.
    Returns (predicted_sCh, error_msg). Same pipeline as batch.
    """
    pipe = load_pipeline()
    if pipe is None:
        return None, "RF pipeline not loaded (check rf_model.joblib and feature_columns.joblib)"

    try:
        df = _request_to_dataframe(data)
        df = pipe.clean_data(df)
        if df.empty:
            return None, "Row dropped by clean_data (e.g. missing Region)"
        df_processed = pipe.preprocess(df)
        predictions = pipe.predict(df_processed)
        # Model outputs (cCh, sCh) in original space after expm1; index 1 = sCh
        pred = float(predictions[0, 1])
        if not np.isfinite(pred) or pred < 0:
            pred = 0.0
        # Optional: cap by recent history if provided
        if historical_data and len(historical_data) >= 7:
            recent = historical_data[-7:]
            baseline = max(np.median(recent), np.max(recent) * 0.8) if np.max(recent) > 0 else np.mean(recent)
            if baseline > 0 and pred > baseline * 2:
                pred = min(pred, baseline * 1.2)
        return pred, None
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, str(e)


if FLASK_AVAILABLE:

    @app.route("/api/cholera-data", methods=["GET"])
    def cholera_data():
        """Fetch cholera_reports from Supabase, run through RF pipeline, return cleaned data + predictions."""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify(
                {
                    "error": "SUPABASE_URL and SUPABASE_ANON_KEY must be set for backend data access.",
                }
            ), 500

        pipe = load_pipeline()
        if pipe is None:
            return jsonify(
                {
                    "error": "RF pipeline not loaded (check rf_model.joblib and feature_columns.joblib).",
                }
            ), 503

        try:
            base = SUPABASE_URL.rstrip("/")
            url = f"{base}/rest/v1/cholera_reports"
            # Select the same columns the frontend previously used
            params = {
                "select": "id,index,location,tl,tr,deaths,sch,cch,cfr,reporting_date,source_index,source,confidence_weight,processing_notes,source_database,district,region",
            }
            headers = {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Accept": "application/json",
            }
            resp = requests.get(url, params=params, headers=headers, timeout=15)
            resp.raise_for_status()
            rows = resp.json()

            if not rows:
                return jsonify({"data": [], "count": 0})

            raw_df = pd.DataFrame(rows)

            # Map Supabase column names to pipeline expectations
            df = raw_df.copy()
            col_map = {
                "region": "Region",
                "district": "District",
                "tl": "TL",
                "tr": "TR",
                "reporting_date": "reporting_date",
                "deaths": "deaths",
                "cfr": "CFR",
                "sch": "sCh",
                "cch": "cCh",
                "confidence_weight": "confidence_weight",
                "processing_notes": "processing_notes",
                "source": "source",
                "source_database": "source_database",
                "source_index": "source_index",
                "location": "Location",
                "index": "Index",
            }
            for src, dst in col_map.items():
                if src in df.columns:
                    df[dst] = df[src]

            # Run through pipeline: clean_data (for rows), preprocess (for features), predict
            cleaned = pipe.clean_data(df)
            if cleaned.empty:
                return jsonify(
                    {
                        "data": [],
                        "count": 0,
                        "warning": "All rows were dropped by clean_data (e.g. missing Region).",
                    }
                )

            features_df = pipe.preprocess(cleaned.copy())
            preds = pipe.predict(features_df)
            # predictions[:, 1] is sCh (after expm1 in pipeline)
            cleaned["predicted_sCh"] = preds[:, 1]

            # Ensure dates are JSON-serializable
            for col in ["TL", "TR", "reporting_date"]:
                if col in cleaned.columns:
                    cleaned[col] = pd.to_datetime(cleaned[col], errors="coerce").dt.strftime(
                        "%Y-%m-%d"
                    )

            # Preserve original Supabase identifiers and raw row for debug if needed
            # (id, index, location, etc. remain in the frame because we started from raw_df)
            records = cleaned.to_dict(orient="records")
            return jsonify({"data": records, "count": len(records)})
        except requests.RequestException as e:
            return jsonify({"error": f"Supabase request failed: {e}"}), 502
        except Exception as e:
            import traceback

            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @app.route('/health', methods=['GET'])
    def health():
        p = load_pipeline()
        return jsonify({
            'status': 'healthy',
            'model': 'available' if p is not None else 'unavailable',
            'model_type': 'RandomForest',
            'model_path': RF_MODEL_PATH,
            'api_version': '3.0',
        })

    @app.route('/api/lstm/predict', methods=['POST'])
    def predict():
        """Single prediction. Body: date, region, district, historicalSuspected (optional)."""
        try:
            data = request.json or {}
            historical = data.get('historicalSuspected') or []
            prediction, err_msg = predict_one_row(data, historical)
            if prediction is None:
                return jsonify({
                    'error': err_msg or 'RF pipeline not available or prediction failed',
                    'model_available': os.path.exists(RF_MODEL_PATH),
                }), 503
            return jsonify({
                'prediction': prediction,
                'model_type': 'RandomForest',
                'timestamp': datetime.now().isoformat(),
                'input_features': {
                    'date': data.get('date'),
                    'region': data.get('region'),
                    'district': data.get('district'),
                },
                'historical_data_points': len(historical),
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/lstm/forecast', methods=['POST'])
    def forecast():
        """Multi-step forecast using same RF pipeline; historicalSuspected from frontend."""
        try:
            data = request.json or {}
            steps = max(1, min(int(data.get('steps', 14)), 90))
            historical = list(data.get('historicalSuspected') or [])

            date_str = data.get('date') or datetime.now().strftime('%Y-%m-%d')
            try:
                start_date = datetime.strptime(date_str[:10], '%Y-%m-%d') + timedelta(days=1)
            except Exception:
                start_date = datetime.now() + timedelta(days=1)

            current_history = list(historical)
            if len(current_history) < 30:
                current_history = [0.0] * (30 - len(current_history)) + current_history
            current_history = current_history[-60:]

            current_data = {
                'date': start_date.strftime('%Y-%m-%d'),
                'region': data.get('region', 'Central'),
                'district': data.get('district', ''),
            }
            forecasts = []
            last_error = None

            for step_idx in range(steps):
                pred, err_msg = predict_one_row(current_data, current_history)
                if pred is None:
                    last_error = err_msg or 'Prediction step failed'
                    break
                pred = max(0.0, float(pred))
                current_history.append(pred)
                if len(current_history) > 60:
                    current_history = current_history[-60:]

                forecasts.append({
                    'date': current_data['date'],
                    'predicted': pred,
                    'step': len(forecasts) + 1,
                })
                next_d = datetime.strptime(current_data['date'], '%Y-%m-%d') + timedelta(days=1)
                current_data['date'] = next_d.strftime('%Y-%m-%d')

            if not forecasts:
                return jsonify({
                    'error': last_error or 'Forecast failed',
                    'model_available': os.path.exists(RF_MODEL_PATH),
                    'model_path': RF_MODEL_PATH,
                    'historical_data_points': len(historical),
                    'api_version': '3.0',
                }), 503

            return jsonify({
                'forecast': forecasts,
                'model_type': 'RandomForest',
                'timestamp': datetime.now().isoformat(),
                'historical_data_points': len(historical),
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    load_pipeline()
    print("RF prediction API (same model & pipeline as batch) on http://0.0.0.0:%s" % port)
    print("  /health  GET")
    print("  /api/lstm/predict  POST")
    print("  /api/lstm/forecast  POST")
    if FLASK_AVAILABLE:
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("Flask not installed. Run: pip install flask flask-cors")
