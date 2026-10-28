from fastapi import APIRouter

from schemas.preprocessing_schema import DataProfileResponseData
from utils.response import APIResponse
from services.profile_service import profile_dataframe
from services.minio_file_store_service import load_working_dataframe


from services.minio_file_store_service import get_dataset, save_dataset

router = APIRouter(tags=["Preprocessing"])


@router.get("/preprocessing/profile", response_model=APIResponse)
def profile_data(file_id: str):
    df =get_dataset(file_id)
    result = DataProfileResponseData(
        file_id=file_id,
        rows=len(df),
        columns=profile_dataframe(df)
    )
    data = result.model_dump()
    return APIResponse.ok(
        data=result,
        message="Data profile generated successfully"
    )
