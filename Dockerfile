# syntax=docker/dockerfile:1

# Stage 1: Build frontend.
FROM node:22-alpine3.23 AS build

WORKDIR /build
COPY . .

RUN corepack enable \
    && yarn install --frozen-lockfile --production=false \
    && yarn build

# Stage 2: Python application.
FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy application files.
COPY --from=build /build/dist /app/dist
COPY gocompass /app/gocompass
COPY setup.py /app/

# Install dependencies and application.
RUN python -m pip install --no-cache-dir \
        -r gocompass/requirements.txt \
    && python -m pip install --no-cache-dir --no-deps . \
    && python -m pip check

# Verify important imports.
RUN python -c "\
import flask, goatools, numpy, pandas, scipy, sklearn, simplejson; \
from goatools.anno.factory import get_objanno; \
print('Dependency imports successful')"

WORKDIR /app/gocompass

EXPOSE 5000

CMD ["gunicorn", \
     "--workers", "3", \
     "--timeout", "500", \
     "--graceful-timeout", "500", \
     "--bind", "0.0.0.0:5000", \
     "__init__:app"]
