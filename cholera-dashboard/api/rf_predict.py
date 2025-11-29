"""
Random Forest Model Prediction API
Simple API for Random Forest model predictions using the trained model.
"""

import os
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import warnings
import joblib
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Base directory - go up two levels from api/ to get to Cholera root
# For Vercel, files might be in different locations, try multiple paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try multiple possible paths for model and dataset
POSSIBLE_MODEL_PATHS = [
    os.path.join(BASE_DIR, 'random_forest_model.pkl'),  # Root of Cholera repo
    os.path.join(os.path.dirname(BASE_DIR), 'random_forest_model.pkl'),  # One level up
    '/var/task/random_forest_model.pkl',  # Vercel serverless function root
    'random_forest_model.pkl',  # Current directory
]

POSSIBLE_DATA_PATHS = [
    os.path.join(BASE_DIR, 'cholera_data3.csv'),  # Root of Cholera repo
    os.path.join(os.path.dirname(BASE_DIR), 'cholera_data3.csv'),  # One level up
    '/var/task/cholera_data3.csv',  # Vercel serverless function root
    'cholera_data3.csv',  # Current directory
]

# Find the first existing path
RF_MODEL_PATH = None
for path in POSSIBLE_MODEL_PATHS:
    if os.path.exists(path):
        RF_MODEL_PATH = path
        break

CSV_DATA_PATH = None
for path in POSSIBLE_DATA_PATHS:
    if os.path.exists(path):
        CSV_DATA_PATH = path
        break

# Fallback to original paths if not found
if RF_MODEL_PATH is None:
    RF_MODEL_PATH = os.path.join(BASE_DIR, 'random_forest_model.pkl')
if CSV_DATA_PATH is None:
    CSV_DATA_PATH = os.path.join(BASE_DIR, 'cholera_data3.csv')

# Global model variable
rf_model = None
model_loaded = False
dataset_loaded = False
cholera_dataset = None

def load_cholera_dataset():
    """Load the cholera dataset from CSV file."""
    global cholera_dataset, dataset_loaded
    
    if dataset_loaded and cholera_dataset is not None:
        return cholera_dataset
    
    if not os.path.exists(CSV_DATA_PATH):
        print(f"[WARNING] Dataset not found at: {CSV_DATA_PATH}")
        return None
    
    try:
        print(f"Loading dataset from: {CSV_DATA_PATH}")
        df = pd.read_csv(CSV_DATA_PATH)
        
        # Parse dates (handle DD/MM/YYYY format)
        def parse_date(date_str):
            if pd.isna(date_str):
                return None
            date_str = str(date_str).strip()
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    try:
                        day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                        return pd.Timestamp(year, month, day)
                    except:
                        pass
            try:
                return pd.to_datetime(date_str)
            except:
                return None
        
        df['reporting_date'] = df['reporting_date'].apply(parse_date)
        df = df.dropna(subset=['reporting_date'])
        df = df.sort_values('reporting_date')
        
        # Ensure numeric columns
        numeric_cols = ['sCh', 'cCh', 'deaths', 'CFR']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        cholera_dataset = df
        dataset_loaded = True
        print(f"[OK] Dataset loaded: {len(df)} records from {df['reporting_date'].min()} to {df['reporting_date'].max()}")
        return cholera_dataset
    except Exception as e:
        print(f"[ERROR] Error loading dataset: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def get_historical_sequence(region=None, district=None, end_date=None, sequence_length=30):
    """Extract historical sequence from the dataset."""
    df = load_cholera_dataset()
    if df is None or len(df) == 0:
        return [], None
    
    # Filter by region/district if provided
    filtered_df = df.copy()
    if region and 'Region' in df.columns:
        filtered_df = filtered_df[filtered_df['Region'] == region]
    if district and 'District' in df.columns:
        filtered_df = filtered_df[filtered_df['District'] == district]
    
    # Filter by date if provided
    if end_date:
        end_date = pd.to_datetime(end_date)
        filtered_df = filtered_df[filtered_df['reporting_date'] <= end_date]
    
    # Sort by date
    filtered_df = filtered_df.sort_values('reporting_date')
    
    # Group by date and sum cases
    daily_data = filtered_df.groupby('reporting_date').agg({
        'sCh': 'sum',
        'cCh': 'sum',
        'deaths': 'sum'
    }).reset_index()
    
    # Get the last date in the dataset
    last_date = daily_data['reporting_date'].max() if len(daily_data) > 0 else None
    
    # Get the last sequence_length days
    if len(daily_data) > sequence_length:
        daily_data = daily_data.tail(sequence_length)
    
    # Extract suspected cases sequence
    sequence = daily_data['sCh'].tolist()
    sequence = [float(x) if np.isfinite(x) and x >= 0 else 0.0 for x in sequence]
    
    # Pad with zeros if needed
    while len(sequence) < sequence_length:
        sequence = [0.0] + sequence
    
    return sequence[-sequence_length:], last_date

def load_rf_model():
    """Load the Random Forest model."""
    global rf_model, model_loaded
    
    if model_loaded and rf_model is not None:
        return rf_model
    
    if not os.path.exists(RF_MODEL_PATH):
        print(f"[WARNING] Random Forest model not found at: {RF_MODEL_PATH}")
        return None
    
    try:
        print(f"Loading Random Forest model from: {RF_MODEL_PATH}")
        rf_model = joblib.load(RF_MODEL_PATH)
        model_loaded = True
        print("[OK] Random Forest model loaded successfully")
        
        # Print model info for debugging
        if hasattr(rf_model, 'n_features_in_'):
            print(f"[INFO] Model expects {rf_model.n_features_in_} features")
        print(f"[INFO] Model type: {type(rf_model)}")
        
        return rf_model
    except Exception as e:
        print(f"[ERROR] Error loading Random Forest model: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def prepare_features(data, historical_data=None):
    """Prepare features for Random Forest model prediction.
    Model expects 28 features in this order:
    year, month, quarter, day_of_year, duration_days, deaths, CFR, confidence_weight, 
    outbreak, lag_1, lag_daily_1, lag_2, lag_daily_2, lag_3, lag_daily_3, lag_6, 
    lag_daily_6, lag_12, lag_daily_12, rolling_mean_3, rolling_std_3, rolling_mean_6, 
    rolling_std_6, rolling_mean_12, rolling_std_12, cases_momentum, District_encoded, Region_encoded
    """
    # Get current date - ensure we're using the date from data, not current date
    date_str = data.get('date')
    if not date_str:
        # Fallback to current date only if not provided
        date_str = datetime.now().strftime('%Y-%m-%d')
    current_date = datetime.strptime(date_str, '%Y-%m-%d')
    region = data.get('region', 'Central')
    district = data.get('district', '')
    
    # Get historical data (need at least 12 days for lags)
    if historical_data and len(historical_data) > 0:
        hist = historical_data[-30:] if len(historical_data) >= 30 else historical_data
        while len(hist) < 30:
            hist = [0.0] + hist
    else:
        hist = [0.0] * 30
    
    # Temporal features
    year = current_date.year
    month = current_date.month
    quarter = (month - 1) // 3 + 1
    day_of_year = current_date.timetuple().tm_yday
    
    # Basic features (use defaults/zeros for missing data)
    duration_days = 1.0  # Default to 1 day
    deaths = 0.0  # Not available in prediction context
    CFR = 0.0  # Not available in prediction context
    confidence_weight = 1.0  # Default confidence
    outbreak = 0.0  # No outbreak indicator available
    
    # Lag features (daily and periodic)
    lag_1 = hist[-1] if len(hist) >= 1 else 0.0
    lag_daily_1 = hist[-1] if len(hist) >= 1 else 0.0
    lag_2 = hist[-2] if len(hist) >= 2 else 0.0
    lag_daily_2 = hist[-2] if len(hist) >= 2 else 0.0
    lag_3 = hist[-3] if len(hist) >= 3 else 0.0
    lag_daily_3 = hist[-3] if len(hist) >= 3 else 0.0
    lag_6 = hist[-6] if len(hist) >= 6 else 0.0
    lag_daily_6 = hist[-6] if len(hist) >= 6 else 0.0
    lag_12 = hist[-12] if len(hist) >= 12 else 0.0
    lag_daily_12 = hist[-12] if len(hist) >= 12 else 0.0
    
    # Rolling statistics (3, 6, 12 day windows)
    recent_3 = hist[-3:] if len(hist) >= 3 else hist
    recent_6 = hist[-6:] if len(hist) >= 6 else hist
    recent_12 = hist[-12:] if len(hist) >= 12 else hist
    
    rolling_mean_3 = float(np.mean(recent_3)) if recent_3 else 0.0
    rolling_std_3 = float(np.std(recent_3)) if recent_3 else 0.0
    rolling_mean_6 = float(np.mean(recent_6)) if recent_6 else 0.0
    rolling_std_6 = float(np.std(recent_6)) if recent_6 else 0.0
    rolling_mean_12 = float(np.mean(recent_12)) if recent_12 else 0.0
    rolling_std_12 = float(np.std(recent_12)) if recent_12 else 0.0
    
    # Cases momentum (rate of change)
    if len(hist) >= 2:
        cases_momentum = hist[-1] - hist[-2] if hist[-1] >= hist[-2] else 0.0
    else:
        cases_momentum = 0.0
    
    # District encoding (simple binary - 0 or 1)
    District_encoded = 1.0 if district else 0.0
    
    # Region encoding (simple binary - 0 or 1)
    Region_encoded = 1.0 if region else 0.0
    
    # Build feature vector in exact order expected by model
    features = [
        year, month, quarter, day_of_year,
        duration_days, deaths, CFR, confidence_weight, outbreak,
        lag_1, lag_daily_1, lag_2, lag_daily_2, lag_3, lag_daily_3,
        lag_6, lag_daily_6, lag_12, lag_daily_12,
        rolling_mean_3, rolling_std_3,
        rolling_mean_6, rolling_std_6,
        rolling_mean_12, rolling_std_12,
        cases_momentum,
        District_encoded, Region_encoded
    ]
    
    # Ensure all features are finite
    features = [float(x) if np.isfinite(x) else 0.0 for x in features]
    
    return np.array(features).reshape(1, -1)

def predict_rf(features, historical_data=None):
    """Make prediction using Random Forest model."""
    global rf_model
    
    if rf_model is None:
        rf_model = load_rf_model()
    
    if rf_model is None:
        return None
    
    try:
        # Check feature count matches model expectations
        if hasattr(rf_model, 'n_features_in_'):
            expected_features = rf_model.n_features_in_
            actual_features = features.shape[1]
            if expected_features != actual_features:
                print(f"[ERROR] Feature mismatch! Model expects {expected_features} features, got {actual_features}")
                print(f"[INFO] Features: {features}")
                return None
        
        prediction = rf_model.predict(features)[0]
        prediction = float(prediction)
        
        # Ensure finite and non-negative
        if not np.isfinite(prediction) or prediction < 0:
            prediction = 0.0
        
        # Cap unrealistic predictions MUCH more aggressively
        if historical_data and len(historical_data) >= 7:
            recent_avg = np.mean(historical_data[-7:])
            recent_max = np.max(historical_data[-7:])
            recent_median = np.median(historical_data[-7:])
            
            # Use the median or max as baseline (more stable than average)
            baseline = max(recent_median, recent_max * 0.8) if recent_max > 0 else recent_avg
            
            # If prediction is more than 2x the baseline, cap it very aggressively
            if baseline > 0:
                if prediction > baseline * 2:
                    # Cap to baseline + 20% (very conservative)
                    original_pred = prediction
                    prediction = baseline * 1.2
                    print(f"[INFO] Capped unrealistic prediction. Original: {original_pred:.2f}, Capped to: {prediction:.2f} (baseline: {baseline:.2f}, recent avg: {recent_avg:.2f}, recent max: {recent_max:.2f})")
                elif prediction > baseline * 1.5:
                    # If between 1.5x-2x baseline, cap to baseline + 10%
                    original_pred = prediction
                    prediction = baseline * 1.1
                    print(f"[INFO] Capped high prediction. Original: {original_pred:.2f}, Capped to: {prediction:.2f} (baseline: {baseline:.2f})")
            elif recent_avg > 0:
                # Fallback if baseline is 0 but we have recent data
                if prediction > recent_avg * 2:
                    original_pred = prediction
                    prediction = recent_avg * 1.2
                    print(f"[INFO] Capped using recent avg. Original: {original_pred:.2f}, Capped to: {prediction:.2f} (recent avg: {recent_avg:.2f})")
        
        return prediction
    except Exception as e:
        print(f"[ERROR] Error making Random Forest prediction: {str(e)}")
        print(f"[INFO] Features shape: {features.shape}")
        print(f"[INFO] Features: {features}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    model_status = "available" if os.path.exists(RF_MODEL_PATH) else "unavailable"
    dataset_status = "available" if os.path.exists(CSV_DATA_PATH) else "unavailable"
    
    dataset_loaded = False
    dataset_records = 0
    if dataset_status == "available":
        try:
            df = load_cholera_dataset()
            if df is not None:
                dataset_loaded = True
                dataset_records = len(df)
        except:
            pass
    
    return jsonify({
        'status': 'healthy',
        'model': model_status,
        'model_type': 'Random Forest',
        'dataset': dataset_status,
        'dataset_loaded': dataset_loaded,
        'dataset_records': dataset_records,
        'model_path': RF_MODEL_PATH,
        'dataset_path': CSV_DATA_PATH
    })

@app.route('/api/lstm/predict', methods=['POST'])
def predict():
    """Single prediction endpoint (kept same endpoint name for UI compatibility)."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get historical data from dataset if not provided
        historical_data = data.get('historicalSuspected', [])
        if not historical_data or len(historical_data) == 0:
            region = data.get('region', 'Central')
            district = data.get('district')
            end_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
            historical_data, _ = get_historical_sequence(region=region, district=district, end_date=end_date)
            print(f"Auto-loaded {len(historical_data)} days of historical data for {region}")
        
        # Prepare features
        features = prepare_features(data, historical_data)
        
        # Make prediction
        prediction = predict_rf(features)
        
        if prediction is None:
            return jsonify({
                'error': 'Random Forest model not available or prediction failed',
                'model_available': os.path.exists(RF_MODEL_PATH)
            }), 503
        
        # Ensure all input features are finite
        temp = float(data.get('temperature', 25.0)) if np.isfinite(data.get('temperature', 25.0)) else 25.0
        hum = float(data.get('humidity', 70.0)) if np.isfinite(data.get('humidity', 70.0)) else 70.0
        precip = float(data.get('precipitation', 0.0)) if np.isfinite(data.get('precipitation', 0.0)) else 0.0
        
        return jsonify({
            'prediction': prediction,
            'model_type': 'Random Forest',
            'timestamp': datetime.now().isoformat(),
            'input_features': {
                'date': data.get('date'),
                'region': data.get('region'),
                'temperature': temp,
                'humidity': hum,
                'precipitation': precip,
            },
            'historical_data_points': len(historical_data)
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/lstm/forecast', methods=['POST'])
def forecast():
    """Generate multi-step forecast using Random Forest."""
    try:
        data = request.json
        steps = data.get('steps', 14)  # Default 14-day forecast
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get historical data from dataset if not provided
        historical_data = data.get('historicalSuspected', [])
        
        # ALWAYS get the actual last date from the entire dataset first (not filtered)
        df = load_cholera_dataset()
        if df is None or len(df) == 0:
            return jsonify({'error': 'Dataset not available'}), 503
        
        # Get the absolute last date from the ENTIRE dataset (not filtered by region)
        last_dataset_date = df['reporting_date'].max()
        print(f"[INFO] Last date in ENTIRE dataset: {last_dataset_date}")
        
        region = data.get('region', 'Central')
        district = data.get('district')
        
        if not historical_data or len(historical_data) == 0:
            # Get historical data up to the last date (may be filtered by region)
            end_date = last_dataset_date.strftime('%Y-%m-%d')
            historical_data, _ = get_historical_sequence(region=region, district=district, end_date=end_date, sequence_length=60)
            print(f"Auto-loaded {len(historical_data)} days of historical data for forecast")
            if len(historical_data) > 0:
                print(f"Recent historical values (last 7): {[round(x, 2) for x in historical_data[-7:]]}")
                print(f"Recent max: {max(historical_data[-7:])}, Recent avg: {np.mean(historical_data[-7:]):.2f}")
        
        forecasts = []
        
        # Use iterative forecasting
        current_history = historical_data.copy() if historical_data else [0.0] * 30
        current_data = data.copy()
        
        # ALWAYS start from the day after the last date in ENTIRE dataset (not filtered)
        start_date = pd.to_datetime(last_dataset_date) + timedelta(days=1)
        current_data['date'] = start_date.strftime('%Y-%m-%d')
        print(f"[INFO] Starting forecast from {start_date.strftime('%Y-%m-%d')} (day after last dataset date: {last_dataset_date.strftime('%Y-%m-%d')})")
        
        for step in range(steps):
            # Prepare features with current history
            features = prepare_features(current_data, current_history)
            
            # Predict next value
            prediction = predict_rf(features, current_history)
            
            if prediction is None:
                print(f"[ERROR] Prediction returned None at step {step + 1}")
                # Try to get more info about the model
                if rf_model is None:
                    print("[ERROR] Model is None - attempting to reload")
                    rf_model = load_rf_model()
                if rf_model is not None:
                    print(f"[INFO] Model type: {type(rf_model)}")
                    print(f"[INFO] Model n_features_in_: {getattr(rf_model, 'n_features_in_', 'unknown')}")
                    print(f"[INFO] Features shape: {features.shape}")
                break
            
            # Ensure finite and non-negative
            prediction = float(prediction)
            if not np.isfinite(prediction) or prediction < 0:
                prediction = 0.0
            
            # Add prediction to history
            current_history.append(prediction)
            if len(current_history) > 60:
                current_history = current_history[-60:]
            
            # Update date for next prediction
            current_date = datetime.strptime(current_data.get('date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d')
            current_date += timedelta(days=1)
            current_data['date'] = current_date.strftime('%Y-%m-%d')
            
            forecasts.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'predicted': prediction,
                'step': step + 1
            })
        
        if not forecasts:
            return jsonify({
                'error': 'Forecast generation failed',
                'model_available': os.path.exists(RF_MODEL_PATH),
                'dataset_available': os.path.exists(CSV_DATA_PATH),
                'historical_data_points': len(historical_data)
            }), 503
        
        # Clean forecast data
        cleaned_forecasts = []
        for f in forecasts:
            predicted = float(f.get('predicted', 0))
            if not np.isfinite(predicted) or predicted < 0:
                predicted = 0.0
            cleaned_forecasts.append({
                'date': f.get('date'),
                'predicted': predicted,
                'step': f.get('step')
            })
        
        return jsonify({
            'forecast': cleaned_forecasts,
            'model_type': 'Random Forest',
            'timestamp': datetime.now().isoformat(),
            'historical_data_points': len(historical_data)
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"\n{'='*60}")
    print(f"Starting Random Forest Prediction API on port {port}")
    print(f"{'='*60}")
    print(f"Model Path: {RF_MODEL_PATH}")
    print(f"Model Exists: {os.path.exists(RF_MODEL_PATH)}")
    print(f"Dataset Path: {CSV_DATA_PATH}")
    print(f"Dataset Exists: {os.path.exists(CSV_DATA_PATH)}")
    
    # Pre-load dataset
    print("\nPre-loading dataset...")
    load_cholera_dataset()
    
    print(f"\nAPI ready! Endpoints:")
    print(f"  - Health: http://localhost:{port}/health")
    print(f"  - Predict: http://localhost:{port}/api/lstm/predict")
    print(f"  - Forecast: http://localhost:{port}/api/lstm/forecast")
    print(f"{'='*60}\n")
    
    app.run(host='0.0.0.0', port=port, debug=False)

