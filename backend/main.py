from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.routers.upload import router as upload_router
from backend.routers.outliers import router as outliers_router
from backend.routers.deduplication import router as dedup_router
from backend.routers.type_correction import router as type_router
from backend.routers.log_transform import router as log_transform_router
from backend.routers.sampling import router as sampling_router
from backend.routers.dataset import router as dataset_router
from backend.routers.crosstab import router as crosstab_router

load_dotenv()
app = FastAPI(
    title="Data Cleaning API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(outliers_router)
app.include_router(dedup_router)
app.include_router(type_router)
app.include_router(log_transform_router)
app.include_router(sampling_router)
app.include_router(dataset_router)
app.include_router(crosstab_router)