"""
CholeraPredictionPipeline — shared with root cholera_pipeline.py.
Used when API runs without repo root (e.g. deployment). Same logic as cholera_pipeline.py.
"""
import pandas as pd
import numpy as np
import joblib


class CholeraPredictionPipeline:

    def __init__(self,
                 model_path="rf_model.joblib",
                 feature_path="feature_columns.joblib"):

        self.model = joblib.load(model_path)
        self.feature_columns = joblib.load(feature_path)

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

    def preprocess(self, df):
        if 'confidence_weight' in df.columns:
            df['confidence_weight'] = df['confidence_weight'].fillna(
                df['confidence_weight'].median()
            )
        if 'deaths' in df.columns:
            df['deaths_log'] = np.log1p(df['deaths'])
        if 'cCh' in df.columns:
            df['cCh_log'] = np.log1p(df['cCh'])
        if 'sCh' in df.columns:
            df['sCh_log'] = np.log1p(df['sCh'])

        if 'CFR' in df.columns:
            df['CFR'] = df['CFR'].clip(0, 1)

        for col in ['TL', 'TR', 'reporting_date']:
            if col in df.columns:
                df[f'{col}_year'] = df[col].dt.year
                df[f'{col}_month'] = df[col].dt.month
                df[f'{col}_day'] = df[col].dt.day
                df[f'{col}_dayofweek'] = df[col].dt.dayofweek

        drop_cols = [
            'processing_notes',
            'source_database',
            'source',
            'source_index',
            'Location',
            'deaths',
            'cCh',
            'sCh'
        ]
        df = df.drop(columns=[c for c in drop_cols if c in df.columns])

        df = pd.get_dummies(df, columns=['District', 'Region'], drop_first=True)
        df = df.reindex(columns=self.feature_columns, fill_value=0)

        return df

    def predict(self, df):
        log_predictions = self.model.predict(df)
        predictions = np.expm1(log_predictions)
        return predictions

    def run_pipeline(self, csv_path):
        df = pd.read_csv(csv_path)
        df = self.clean_data(df)
        df_processed = self.preprocess(df)
        predictions = self.predict(df_processed)
        result = pd.DataFrame({
            "predicted_sCh": predictions[:, 1]
        })
        return result.to_dict(orient="records")
