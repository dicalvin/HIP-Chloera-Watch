# Cholera Surveillance Dashboard

A comprehensive web-based dashboard for monitoring, analyzing, and forecasting cholera cases in Uganda using machine learning models and real-time weather data.

## Features

- **Interactive Analytics**: Multiple chart types showing suspected vs confirmed cases, regional distributions, CFR trends, and more
- **Early Warning System**: AI-powered forecasts using Random Forest model for 14-day predictions
- **Weather Integration**: Real-time weather data from WeatherAPI.com with alerts for extreme conditions
- **Interactive Map**: Choropleth map of Uganda districts with case data visualization
- **Response Insights**: Analysis of spread patterns and response effectiveness
- **Resource Planning**: Priority area identification and impact assessment

## Technology Stack

### Frontend
- React 18+ with Vite
- Recharts for data visualization
- React Leaflet for interactive maps
- Framer Motion for animations

### Backend
- Flask API for model predictions
- Random Forest model (scikit-learn) for forecasting
- WeatherAPI.com integration

### Data
- Historical cholera data (2011-2024)
- GeoJSON for Uganda district boundaries
- Real-time weather data

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8-3.11 (for scikit-learn compatibility)
- npm or yarn

### Frontend Setup

```bash
cd cholera-dashboard
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend API Setup

```bash
cd cholera-dashboard/api
pip install -r requirements.txt
python rf_predict.py
```
The API uses the same **Random Forest** model and **CholeraPredictionPipeline** as batch (`cholera_pipeline.py`). Ensure `rf_model.joblib` and `feature_columns.joblib` are in the project root or in `cholera-dashboard/api/`.

The API will run on `http://localhost:5001`

### Required Files

Place these files in the root `Cholera` directory:
- `cholera_data3.csv` - Main dataset
- `rf_model.joblib` - Trained Random Forest model
- `feature_columns.joblib` - Feature column names (for pipeline)
- `ug.json` - GeoJSON file for Uganda districts

## Project Structure

```
Cholera/
├── cholera_data3.csv          # Main dataset
├── rf_model.joblib             # Random Forest model
├── feature_columns.joblib      # Pipeline feature columns
├── ug.json                    # GeoJSON for Uganda
├── cholera-dashboard/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utility functions
│   ├── api/
│   │   ├── rf_predict.py      # RF API (same model & pipeline as batch)
│   │   └── requirements.txt   # Python dependencies
│   └── public/                # Static assets
└── METHODOLOGY.tex            # Methodology documentation
```

## API Endpoints

- `GET /health` - Health check and model status
- `POST /api/lstm/predict` - Single prediction (kept for UI compatibility)
- `POST /api/lstm/forecast` - 14-day forecast

## Model Information

The dashboard uses a **Random Forest** model trained on historical cholera data. The model:
- Predicts suspected cholera cases
- Incorporates weather conditions (temperature, humidity, precipitation)
- Uses historical trends and geographical factors
- Generates 14-day forecasts
- Automatically loads historical data from the dataset

## Deployment

The project is ready for deployment on platforms like:
- Vercel (frontend)
- Railway/Render (backend API)
- GitHub Pages (static frontend)

See `DEPLOYMENT_INSTRUCTIONS.md` for detailed deployment steps.

## License

This project is part of a Data Science research project.

