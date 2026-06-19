from fastapi import APIRouter, Form
from backend.storage.dataset_store import apply_preview, cancel_preview, get_dataset

router = APIRouter(prefix="/dataset", tags=["Dataset"])

@router.post("/apply-preview")
async def apply(dataset_id: str = Form(...)):
    try:
        df = apply_preview(dataset_id)
        return {
            "message": "Preview appliqué avec succès",
            "rows": df.height,
            "preview": df.head(5).to_dicts()
        }
    except FileNotFoundError:
        return {"error": "Aucun preview en attente"}

@router.post("/cancel-preview")
async def cancel(dataset_id: str = Form(...)):
    cancel_preview(dataset_id)
    return {"message": "Preview annulé, dataset inchangé"}