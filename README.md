# DataSense Pro — Data Preparation & Analytics Platform

A self-service data preparation application developed during my Data / Full-Stack internship at **QU2DATA** (June–August 2026).

## What it solves
CSV and Excel files often contain missing values, duplicates, inconsistent types, and outliers. DataSense Pro provides a workflow to inspect, prepare, and transform datasets before analysis.

## My contributions
- Implemented a **Python/FastAPI data-processing microservice with 40+ REST endpoints**, using Pydantic validation and centralized error handling.
- Built dataset profiling and preparation features: missing-value handling, deduplication, outlier detection, type conversion, imputation, encoding, normalization, sampling, and transformations.
- Implemented dataset states on **MinIO/S3**: `original`, `preview`, and `current`, enabling previews before committing changes.
- Integrated the service with a **Node.js/TypeScript backend** through REST and GraphQL, JWT authentication, and PostgreSQL metadata storage.

## Technologies
Python · FastAPI · Pydantic · Pandas · PostgreSQL · MinIO/S3 · Node.js · TypeScript · REST · GraphQL · JWT

## Architecture (simplified)
```text
CSV / Excel upload
       |
       v
Backend (Node.js / TypeScript) --- PostgreSQL (metadata)
       |
       v
FastAPI processing service --- MinIO / S3 (original / preview / current)
       |
       v
Profile -> Clean -> Transform -> Preview -> Commit
```

## Repository structure
- `backend/`: backend implementation (see its own dependencies and configuration).
- `frontend/`: web interface.
- `test.html`: development/testing asset.

## Running the project
This repository contains multiple application components. Consult the manifests in `backend/` and `frontend/` for their individual dependencies. A reproducible full-stack setup and environment-variable template are still to be documented; avoid assuming the application works with one command.

## Notes
This is a project developed in a team/internship setting. The bullets above describe **my contributions**, not necessarily every feature of the full product. Never commit production secrets, customer data, or proprietary material without authorization.

## Contact
[GitHub profile](https://github.com/ranim147) · [LinkedIn](https://www.linkedin.com/in/ranim-bettaieb)
