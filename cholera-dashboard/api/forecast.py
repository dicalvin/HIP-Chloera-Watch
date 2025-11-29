"""
Vercel Serverless Function - Multi-step forecast endpoint
"""
import json
import os
import sys
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pandas as pd
    import numpy as np
    from api.rf_predict import load_rf_model, load_cholera_dataset, get_historical_sequence, prepare_features, predict_rf
    
    def handler(request):
        """Handle forecast request"""
        try:
            # Parse request body
            if isinstance(request.get('body'), str):
                body = json.loads(request.get('body', '{}'))
            else:
                body = request.get('body', {})
            
            if not body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    'body': json.dumps({'error': 'No data provided'})
                }
            
            steps = body.get('steps', 14)
            
            # Get historical data
            historical_data = body.get('historicalSuspected', [])
            
            # Get last date from entire dataset
            df = load_cholera_dataset()
            if df is None or len(df) == 0:
                return {
                    'statusCode': 503,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Dataset not available'})
                }
            
            last_dataset_date = df['reporting_date'].max()
            region = body.get('region', 'Central')
            district = body.get('district')
            
            if not historical_data or len(historical_data) == 0:
                end_date = last_dataset_date.strftime('%Y-%m-%d')
                historical_data, _ = get_historical_sequence(region=region, district=district, end_date=end_date, sequence_length=60)
            
            forecasts = []
            current_history = historical_data.copy() if historical_data else [0.0] * 30
            current_data = body.copy()
            
            # Start from day after last dataset date
            start_date = pd.to_datetime(last_dataset_date) + timedelta(days=1)
            current_data['date'] = start_date.strftime('%Y-%m-%d')
            
            for step in range(steps):
                # Prepare features
                features = prepare_features(current_data, current_history)
                
                # Predict
                prediction = predict_rf(features, current_history)
                
                if prediction is None:
                    break
                
                # Ensure finite and non-negative
                prediction = float(prediction)
                if not np.isfinite(prediction) or prediction < 0:
                    prediction = 0.0
                
                # Add to history
                current_history.append(prediction)
                if len(current_history) > 60:
                    current_history = current_history[-60:]
                
                # Update date
                current_date = datetime.strptime(current_data.get('date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d')
                current_date += timedelta(days=1)
                current_data['date'] = current_date.strftime('%Y-%m-%d')
                
                forecasts.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'predicted': prediction,
                    'step': step + 1
                })
            
            if not forecasts:
                return {
                    'statusCode': 503,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Forecast generation failed'})
                }
            
            # Clean forecasts
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
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'forecast': cleaned_forecasts,
                    'model_type': 'Random Forest',
                    'timestamp': datetime.now().isoformat(),
                    'historical_data_points': len(historical_data)
                })
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)})
            }
except ImportError as e:
    def handler(request):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Import error: {str(e)}'})
        }

