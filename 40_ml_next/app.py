from fastapi import FastAPI
import joblib

app = FastAPI()

# model = joblib.load("model_next.pkl")

@app.post("/predict")
def predict(payload: dict):
    return {"prediction": "stub_next"}
