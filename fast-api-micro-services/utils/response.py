from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None

    @staticmethod
    def ok(data=None, message="success"):
        return APIResponse(
            success=True,
            message=message,
            data=data
        )

    @staticmethod
    def fail(message="error", data=None):
        return APIResponse(
            success=False,
            message=message,
            data=data
        )
