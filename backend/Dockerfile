FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY ml_service/requirements.txt* /app/ml_service/
COPY backend/requirements.txt* /app/backend/

# Install requirements
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic \
    pydantic-settings \
    email-validator \
    sqlalchemy \
    aiosqlite \
    python-jose \
    bcrypt \
    python-multipart \
    requests \
    scikit-learn \
    lightgbm \
    pandas \
    numpy \
    joblib

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
