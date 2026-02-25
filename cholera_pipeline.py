
import pandas as pd
import numpy as np
import joblib

class CholeraPredictionPipeline:

    def __init__(self,
                 model_path="rf_model.joblib",
                 feature_path="feature_columns.joblib"):

        self.model = joblib.load(model_path)
        self.feature_columns = joblib.load(feature_path)

    # -----------------------
    # CLEANING
    # -----------------------
    def clean_data(self, df):

        if 'Index' in df.columns:
            df = df.drop(columns=['Index'])

        date_cols = ['TL', 'TR', 'reporting_date']
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce', dayfirst=True)

        df = df.dropna(subset=['Region'])
        df = df.drop_duplicates()

        return df

    # -----------------------
    # PREPROCESSING
    # -----------------------
    def preprocess(self, df):

        # Fill confidence weight
        if 'confidence_weight' in df.columns:
            df['confidence_weight'] = df['confidence_weight'].fillna(
                df['confidence_weight'].median()
            )
        #log
        if 'deaths' in df.columns:
            df['deaths_log'] = np.log1p(df['deaths'])
        if 'cCh' in df.columns:
            df['cCh_log'] = np.log1p(df['cCh'])
        if 'sCh' in df.columns:
            df['sCh_log'] = np.log1p(df['sCh'])

        # Cap CFR
        if 'CFR' in df.columns:
            df['CFR'] = df['CFR'].clip(0, 1)

        # Date feature engineering
        for col in ['TL', 'TR', 'reporting_date']:
            if col in df.columns:
                df[f'{col}_year'] = df[col].dt.year
                df[f'{col}_month'] = df[col].dt.month
                df[f'{col}_day'] = df[col].dt.day
                df[f'{col}_dayofweek'] = df[col].dt.dayofweek

        # Drop unused columns
        drop_cols = [
            'processing_notes',
            'source_database',
            'source',
            'source_index',
            'Location',
            'deaths',
            'cCh',
            'sCh'  # IMPORTANT: drop original target
        ]

        df = df.drop(columns=[c for c in drop_cols if c in df.columns])

        # One-hot encode
        df = pd.get_dummies(df, columns=['District', 'Region'], drop_first=True)

        # Align with training features
        df = df.reindex(columns=self.feature_columns, fill_value=0)

        return df

    # -----------------------
    # PREDICTION
    # -----------------------
    def predict(self, df):

        log_predictions = self.model.predict(df)

        # Convert back from log
        predictions = np.expm1(log_predictions)

        return predictions

    # -----------------------
    # FULL PIPELINE
    # -----------------------
    def run_pipeline(self, csv_path):

        df = pd.read_csv(csv_path)

        df = self.clean_data(df)
        df_processed = self.preprocess(df)

        predictions = self.predict(df_processed)

        # The model predicts two outputs (cCh_log, sCh_log). Select sCh_log which is the second column (index 1).
        result = pd.DataFrame({
            "predicted_sCh": predictions[:, 1]
        })

        return result.to_dict(orient="records")