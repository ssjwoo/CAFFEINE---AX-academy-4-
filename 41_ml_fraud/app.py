from fastapi import FastAPI

app = FastAPI()

@app.post("/predict")
def predict(payload: dict):
    return {"fraud_result": False}
