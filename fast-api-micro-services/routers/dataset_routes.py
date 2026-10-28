from fastapi import APIRouter
from storage.dataset_store import apply_preview, cancel_preview

from utils.response import APIResponse
from schemas.dataset_schema import (
    ApplyPreviewRequest,
    ApplyPreviewResponseData,
    CancelPreviewRequest,
    CancelPreviewResponseData,
)

router = APIRouter(prefix="/dataset", tags=["Dataset"])


@router.post(
    "/apply-preview",
    response_model=APIResponse[ApplyPreviewResponseData],
)
async def apply(request: ApplyPreviewRequest):
    dataset_id = request.dataset_id

    try:
        df = apply_preview(dataset_id)

        return APIResponse.ok(
            ApplyPreviewResponseData(
                file_id=dataset_id,
                rows=len(df),
                preview=df.head(5).to_dict(orient="records"),
            )
        )
    except FileNotFoundError:
        return APIResponse.fail("Aucun preview en attente")


@router.post(
    "/cancel-preview",
    response_model=APIResponse[CancelPreviewResponseData],
)
async def cancel(request: CancelPreviewRequest):
    dataset_id = request.dataset_id

    cancel_preview(dataset_id)

    return APIResponse.ok(
        CancelPreviewResponseData(
            file_id=dataset_id,
        )
    )