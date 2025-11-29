"""
Health check endpoint for Vercel
"""
import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from api.rf_predict import load_rf_model, load_cholera_dataset
    
    def handler(request):
        """Health check handler"""
        try:
            # Try to load model and dataset
            model = load_rf_model()
            dataset = load_cholera_dataset()
            
            model_status = "available" if model is not None else "unavailable"
            dataset_status = "available" if dataset is not None and len(dataset) > 0 else "unavailable"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'status': 'ok',
                    'model': model_status,
                    'dataset': dataset_status,
                    'message': 'API is operational'
                })
            }
        except Exception as e:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'ok',
                    'model': 'unavailable',
                    'dataset': 'unavailable',
                    'error': str(e)
                })
            }
except ImportError:
    def handler(request):
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'error',
                'error': 'Failed to import API modules'
            })
        }

