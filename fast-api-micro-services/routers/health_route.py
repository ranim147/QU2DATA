from fastapi import APIRouter
from utils.response import APIResponse

router = APIRouter(tags=["Health"])


@router.get("", response_model=APIResponse)
def health_check():
    return APIResponse.ok(
        data={
            "service": "Qu2Data Math Service",
            "version": "1.0.0"
        },
        message="Qu2Data Math Service is running"
    )
