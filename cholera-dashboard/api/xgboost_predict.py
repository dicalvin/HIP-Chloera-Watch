"""
XGBoost prediction API for cholera suspected cases (sCh).
Uses only request body data: the frontend sends historicalSuspected and context
from Supabase (useCholeraData → filteredData). No local CSV or database.
"""
import os
import json
import numpy as np
from datetime import datetime, timedelta

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    app = Flask(__name__)
    CORS(app)
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    app = None

# Paths: api/ -> cholera-dashboard -> Cholera root; also cwd when loading
_API_DIR = os.path.dirname(os.path.abspath(__file__))
_CHOLERA_DASHBOARD = os.path.dirname(_API_DIR)
_CHOLERA_ROOT = os.path.dirname(_CHOLERA_DASHBOARD)


def _find_model_path():
    """
    Try to locate xgboost_model.joblib in a few common places.
    Priority:
      1. Same folder as this file (works well for Vercel / other deployments)
      2. cholera-dashboard root
      3. Cholera project root
      4. Current working directory and its parent
    """
    bases = [_API_DIR, _CHOLERA_DASHBOARD, _CHOLERA_ROOT]
    try:
        cwd = os.getcwd()
        bases.extend([cwd, os.path.dirname(cwd)])
    except Exception:
        pass
    for base in bases:
        p = os.path.join(base, 'xgboost_model.joblib')
        if os.path.isfile(p):
            return p
    return os.path.join(_CHOLERA_ROOT, 'xgboost_model.joblib')


XGBOOST_MODEL_PATH = _find_model_path()

# Global model (load once)
xgboost_model = None
model_loaded = False


def load_model():
    """Load XGBoost model from joblib file."""
    global xgboost_model, model_loaded
    if model_loaded and xgboost_model is not None:
        return xgboost_model
    if not os.path.exists(XGBOOST_MODEL_PATH):
        print(f"[WARNING] XGBoost model not found at: {XGBOOST_MODEL_PATH}")
        return None
    try:
        import joblib
        print(f"Loading XGBoost model from: {XGBOOST_MODEL_PATH}")
        xgboost_model = joblib.load(XGBOOST_MODEL_PATH)
        model_loaded = True
        n = getattr(xgboost_model, 'n_features_in_', None)
        print(f"[OK] XGBoost model loaded (n_features_in_={n})")
        return xgboost_model
    except Exception as e:
        print(f"[ERROR] Loading XGBoost model: {e}")
        import traceback
        traceback.print_exc()
        return None


def _get_feature_names():
    """Return model feature names in order (from loaded model or cache)."""
    global xgboost_model
    if xgboost_model is not None and hasattr(xgboost_model, 'feature_names_in_'):
        return [str(n) for n in xgboost_model.feature_names_in_]
    return None


def prepare_features(data, historical_data=None):
    """
    Build feature vector matching the trained XGBoost model (130 features).
    Uses feature_names_in_ from the loaded model: deaths, CFR, confidence_weight,
    TL_* / TR_* / reporting_date_* datetime, District_* one-hot, Region_* one-hot.
    """
    global xgboost_model
    if xgboost_model is None:
        load_model()
    names = _get_feature_names()
    if not names:
        return None, "Model not loaded or has no feature_names_in_"

    date_str = data.get('date') or datetime.now().strftime('%Y-%m-%d')
    try:
        current_date = datetime.strptime(date_str[:10], '%Y-%m-%d')
    except Exception:
        current_date = datetime.now()

    region = (data.get('region') or 'Central').strip()
    district = (data.get('district') or '').strip()

    # Normalize for one-hot: match model names case-insensitively
    district_lower = district.replace(' ', '_').lower() if district else None
    region_lower = region.lower()

    values = {}
    values['deaths'] = float(data.get('deaths', 0) or 0)
    values['CFR'] = float(data.get('CFR', 0) or 0)
    values['confidence_weight'] = float(data.get('confidence_weight', 1) or 1)

    for prefix in ('TL_', 'TR_', 'reporting_date_'):
        values[prefix + 'year'] = current_date.year
        values[prefix + 'month'] = current_date.month
        values[prefix + 'day'] = current_date.day
        values[prefix + 'dayofweek'] = current_date.weekday()
        values[prefix + 'dayofyear'] = current_date.timetuple().tm_yday

    for name in names:
        if name.startswith('District_'):
            # Match "District_Kampala" with district "Kampala" or "kampala" (case-insensitive)
            name_suffix = str(name)[9:].replace('_', ' ').lower() if len(name) > 9 else ''
            values[name] = 1.0 if (district_lower and name_suffix == district_lower.replace('_', ' ')) else 0.0
        elif name.startswith('Region_'):
            name_region = str(name)[7:].lower()  # "Eastern" from "Region_Eastern"
            values[name] = 1.0 if name_region == region_lower else 0.0

    try:
        feature_vec = np.array([float(values.get(n, 0.0)) for n in names], dtype=np.float64)
        feature_vec = np.nan_to_num(feature_vec, nan=0.0, posinf=0.0, neginf=0.0)
        return feature_vec.reshape(1, -1), None
    except Exception as e:
        return None, str(e)


def predict_one(features, historical_data=None):
    """Single-step prediction. Uses global xgboost_model. Returns (pred, error_msg)."""
    global xgboost_model
    if xgboost_model is None:
        load_model()
    if xgboost_model is None:
        return None, "Model not loaded (check path: %s)" % XGBOOST_MODEL_PATH
    try:
        n_expected = getattr(xgboost_model, 'n_features_in_', None)
        if n_expected is not None and features.shape[1] != n_expected:
            return None, "Feature count mismatch: model expects %d, got %d" % (n_expected, features.shape[1])
        raw = xgboost_model.predict(features)
        row = raw[0] if hasattr(raw, '__getitem__') else raw
        if hasattr(row, '__len__') and not isinstance(row, (str, bytes)):
            pred = float(row[0]) if len(row) > 0 else 0.0
        else:
            pred = float(row)
        if not np.isfinite(pred) or pred < 0:
            pred = 0.0
        if historical_data and len(historical_data) >= 7:
            recent = historical_data[-7:]
            baseline = max(np.median(recent), np.max(recent) * 0.8) if np.max(recent) > 0 else np.mean(recent)
            if baseline > 0 and pred > baseline * 2:
                pred = min(pred, baseline * 1.2)
        return pred, None
    except Exception as e:
        print(f"[ERROR] Predict: {e}")
        import traceback
        traceback.print_exc()
        return None, str(e)


if FLASK_AVAILABLE:

    @app.route('/health', methods=['GET'])
    def health():
        m = load_model()
        return jsonify({
            'status': 'healthy',
            'model': 'available' if m is not None else 'unavailable',
            'model_type': 'XGBoost',
            'model_path': XGBOOST_MODEL_PATH,
            'api_version': '2.0',
        })

    @app.route('/api/lstm/predict', methods=['POST'])
    def predict():
        """Single prediction. Body: date, region, district, historicalSuspected (from Supabase)."""
        try:
            data = request.json or {}
            historical = data.get('historicalSuspected') or []
            features, prep_err = prepare_features(data, historical)
            if features is None:
                return jsonify({'error': prep_err or 'Failed to prepare features'}), 503
            prediction, err_msg = predict_one(features, historical)
            if prediction is None:
                return jsonify({
                    'error': err_msg or 'XGBoost model not available or prediction failed',
                    'model_available': os.path.exists(XGBOOST_MODEL_PATH),
                }), 503
            return jsonify({
                'prediction': prediction,
                'model_type': 'XGBoost',
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
        """Multi-step forecast. Uses only request body; historicalSuspected should be sent from frontend (Supabase data)."""
        try:
            data = request.json or {}
            steps = max(1, min(int(data.get('steps', 14)), 90))
            historical = list(data.get('historicalSuspected') or [])
            print(f"[FORECAST] Request: steps={steps}, region={data.get('region')}, district={data.get('district')}, date={data.get('date')}, historical_points={len(historical)}")

            # Rolling history for iterative forecast
            current_history = list(historical)
            if len(current_history) < 30:
                current_history = [0.0] * (30 - len(current_history)) + current_history
            current_history = current_history[-60:]

            # Start from day after last known date or today
            date_str = data.get('date') or datetime.now().strftime('%Y-%m-%d')
            try:
                start_date = datetime.strptime(date_str[:10], '%Y-%m-%d') + timedelta(days=1)
            except Exception:
                start_date = datetime.now() + timedelta(days=1)

            current_data = {
                'date': start_date.strftime('%Y-%m-%d'),
                'region': data.get('region', 'Central'),
                'district': data.get('district', ''),
            }
            forecasts = []

            last_error = None
            for step_idx in range(steps):
                try:
                    feats, prep_err = prepare_features(current_data, current_history)
                    if feats is None:
                        last_error = prep_err or 'Failed to prepare features'
                        break
                    pred, err_msg = predict_one(feats, current_history)
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
                except Exception as e:
                    last_error = 'Step %d: %s' % (step_idx + 1, str(e))
                    print(f"[FORECAST] Exception: {last_error}")
                    import traceback
                    traceback.print_exc()
                    break

            if not forecasts:
                err = last_error or 'Forecast failed. Restart the API: cd cholera-dashboard/api && python xgboost_predict.py'
                print(f"[FORECAST] Failed: {err}")
                return jsonify({
                    'error': err,
                    'model_available': os.path.exists(XGBOOST_MODEL_PATH),
                    'model_path': XGBOOST_MODEL_PATH,
                    'historical_data_points': len(historical),
                    'api_version': '2.0',
                }), 503

            return jsonify({
                'forecast': forecasts,
                'model_type': 'XGBoost',
                'timestamp': datetime.now().isoformat(),
                'historical_data_points': len(historical),
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    load_model()
    print(f"XGBoost prediction API on http://0.0.0.0:{port}")
    print("  /health  GET")
    print("  /api/lstm/predict  POST")
    print("  /api/lstm/forecast  POST")
    if FLASK_AVAILABLE:
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("Flask not installed. Run: pip install flask flask-cors")
