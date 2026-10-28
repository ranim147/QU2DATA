from fastapi import FastAPI, Depends, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.exceptions import HTTPException as StarletteHTTPException

import logging
from typing import Any

import api_clients
from database import Base, engine
from dependencies.auth_dependency import verify_token
from routers.auth_routers import router as auth_router
from routers.crosstab_route import router as crosstab_router
from routers.deduplication_routes import router as dedup_router
from routers.dataset_routes import router as dataset_router
from routers.files_route import router as files_router
from routers.filtering_route import router as filtering_router
from routers.file_merge_routes import router as file_merge_router
from routers.health_route import router as health_router
from routers.log_transform_routes import router as log_transform_router
from routers.outliers_routes import router as outliers_router
from routers.preprocessing_route import router as preprocessing_router
from routers.profile_route import router as profile_router
from routers.sampling_route import router as sampling_router
from routers.transformation_route import router as transformation_router
from routers.type_correction_routes import router as type_router
from routers.upload_routes import router as upload_router

from utils.response import APIResponse
from contextlib import asynccontextmanager
from storage.init_apps import init_apps

load_dotenv()

Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)
init_apps()
def _error_message(detail: Any) -> str:
    if isinstance(detail, str):
        return detail
    return "Request could not be processed"

app = FastAPI(
    title="Qu2Data Math Service",
    description="File parsing and mathematical preprocessing service",
    version="1.0.0",
    openapi_tags=[
        {"name": "Health"},
        {"name": "Authentication"},
        {"name": "Upload"},
        {"name": "Files"},
        {"name": "Dataset"},
        {"name": "Preprocessing"},
        {"name": "Column Transformations"},
        {"name": "Row Operations"},
        {"name": "Sampling"},
        {"name": "File Merge"},
        {"name": "Crosstab"},
       
    ],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(
            APIResponse.fail(
                message=_error_message(exc.detail)
            ).model_dump()
        ),
        headers=exc.headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content=APIResponse.fail(
            message="Request validation failed",
            data=exc.errors()
        ).model_dump()
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception("Unhandled error while processing %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content=APIResponse.fail(
            message="Internal server error"
        ).model_dump()
    )

app.include_router(health_router, prefix="/health")
app.include_router(auth_router)
app.include_router(upload_router, dependencies=[Depends(verify_token)])
app.include_router(files_router, dependencies=[Depends(verify_token)])
app.include_router(outliers_router, dependencies=[Depends(verify_token)])
app.include_router(dedup_router, dependencies=[Depends(verify_token)])
app.include_router(type_router, dependencies=[Depends(verify_token)])
app.include_router(log_transform_router, dependencies=[Depends(verify_token)])
app.include_router(sampling_router, dependencies=[Depends(verify_token)])
app.include_router(dataset_router, dependencies=[Depends(verify_token)])
app.include_router(crosstab_router, dependencies=[Depends(verify_token)])
app.include_router(profile_router, dependencies=[Depends(verify_token)])
app.include_router(preprocessing_router, dependencies=[Depends(verify_token)])
app.include_router(transformation_router, dependencies=[Depends(verify_token)])
app.include_router(filtering_router, dependencies=[Depends(verify_token)])
app.include_router(file_merge_router, dependencies=[Depends(verify_token)])
