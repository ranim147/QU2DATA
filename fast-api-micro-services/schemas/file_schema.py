from typing import Any, Dict, List

from pydantic import BaseModel


class FileUploadResponseData(BaseModel):
    file_id: str
    filename: str
    file_type: str
    rows: int
    columns: List[str]
    missing_values: Dict[str, int]
    dtypes: Dict[str, str]
    preview: List[Dict[str, Any]]


class FileProfileRequest(BaseModel):
    file_id: str
