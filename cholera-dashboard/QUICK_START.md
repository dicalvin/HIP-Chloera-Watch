# Quick Start Guide

## Starting the Application

### 1. Start the API Server

Open a terminal in the `cholera-dashboard/api` folder and run:

```bash
python rf_predict.py
```

Or use the batch file:
```bash
start_api.bat
```

The API will start on **http://localhost:5001**

### 2. Start the Frontend

Open a **separate** terminal in the `cholera-dashboard` folder and run:

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## Verify Everything is Running

### Check API Health
Visit: http://localhost:5001/health

Should return:
```json
{
  "status": "healthy",
  "model": "available",
  "dataset": "available"
}
```

### Check Frontend
Visit: http://localhost:5173

Should show the Cholera Surveillance Dashboard.

## Troubleshooting

### API Not Starting

1. **Check Python dependencies**:
   ```bash
   cd cholera-dashboard/api
   pip install -r requirements.txt
   ```

2. **Check model file exists**:
   - Should be at: `C:\Users\Family\Desktop\UCU\DS Project\Cholera\random_forest_model.pkl`

3. **Check dataset exists**:
   - Should be at: `C:\Users\Family\Desktop\UCU\DS Project\Cholera\cholera_data3.csv`

### Frontend Not Starting

1. **Install dependencies**:
   ```bash
   cd cholera-dashboard
   npm install
   ```

2. **Check port 5173 is available**:
   - If occupied, Vite will use the next available port

### API Connection Errors

- Make sure API is running on port 5001
- Check browser console for CORS errors
- Verify `VITE_LSTM_API_URL` is set correctly (defaults to `http://localhost:5001`)

## Ports

- **API**: http://localhost:5001
- **Frontend**: http://localhost:5173

## Stopping Servers

- Press `Ctrl+C` in each terminal window to stop the servers

