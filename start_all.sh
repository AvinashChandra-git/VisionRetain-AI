#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/anshupranshu/Desktop/VisionRetainAI"
cd "$ROOT"

# Create venv if missing
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate

# Install deps (pin versions known to work with Python 3.13 on macOS ARM)
pip install --upgrade pip setuptools wheel cython
pip install numpy==1.26.4 scipy==1.17.1 pandas==2.2.2 xgboost==2.0.3 redis==5.0.4 fastapi==0.111.0 'uvicorn[standard]==0.29.0'
# Avoid sklearn building; use binary wheel
pip install scikit-learn==1.5.2 --only-binary=:all:

# Run ML microservice (FastAPI)
uvicorn main:app --host 0.0.0.0 --port 8002 --workers 1

