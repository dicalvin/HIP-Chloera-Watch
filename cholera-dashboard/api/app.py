from flask import Flask, request, jsonify
from flask_cors import CORS
from pipeline import CholeraPredictionPipeline
from supabase import create_client
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load ML pipeline
pipeline = CholeraPredictionPipeline(
    model_path="rf_model.joblib",
    feature_path="feature_columns.joblib"
)

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        # 1️⃣ Fetch rows that have no prediction yet
        response = supabase.table("cholera_reports") \
            .select("*") \
            .is_("predicted_sCh", None) \
            .execute()

        data = response.data
        if not data:
            return jsonify({"message": "No new data to predict."})

        df = pd.DataFrame(data)

        # 2️⃣ Run predictions through your pipeline
        predictions = pipeline.run_from_dataframe(df)

        # 3️⃣ Write predictions back to Supabase
        for i, row in enumerate(predictions):
            supabase.table("cholera_reports").update({
                "predicted_sCh": float(row["predicted_sCh"])
            }).eq("id", data[i]["id"]).execute()

        return jsonify({
            "message": f"{len(predictions)} predictions made and updated.",
            "predictions": predictions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500