"""
Vercel Serverless Function - Main API handler
Routes requests to appropriate endpoints
"""
import json
from api.health import handler as health_handler
from api.predict import handler as predict_handler
from api.forecast import handler as forecast_handler

def handler(request):
    """Main request router for Vercel serverless functions"""
    path = request.get('path', '')
    method = request.get('method', 'GET')
    
    # Route to appropriate handler
    if path == '/api/health' or path == '/health':
        return health_handler(request)
    elif path == '/api/lstm/predict' or path == '/api/predict':
        if method == 'POST':
            return predict_handler(request)
        else:
            return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}
    elif path == '/api/lstm/forecast' or path == '/api/forecast':
        if method == 'POST':
            return forecast_handler(request)
        else:
            return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'})
        }

