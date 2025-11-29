"""
Vercel Serverless Function - Single prediction endpoint
"""
import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from api.rf_predict import load_rf_model, load_cholera_dataset, get_historical_sequence, prepare_features, predict_rf
    
    def handler(request):
        """Handle prediction request"""
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
            
            # Get historical data
            historical_data = body.get('historicalSuspected', [])
            region = body.get('region', 'Central')
            district = body.get('district')
            
            if not historical_data or len(historical_data) == 0:
                # Get from dataset
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
                
                end_date = df['reporting_date'].max().strftime('%Y-%m-%d')
                historical_data, _ = get_historical_sequence(region=region, district=district, end_date=end_date, sequence_length=60)
            
            # Prepare features
            features = prepare_features(body, historical_data)
            
            # Make prediction
            prediction = predict_rf(features, historical_data)
            
            if prediction is None:
                return {
                    'statusCode': 503,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Prediction failed'})
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'predicted': float(prediction),
                    'model_type': 'Random Forest',
                    'timestamp': __import__('datetime').datetime.now().isoformat()
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

