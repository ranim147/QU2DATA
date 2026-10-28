from pydantic import BaseModel


class RegisterRequest(BaseModel):
    api_key: str
    api_secret: str


class RegisterResponse(BaseModel):
    id: str
    api_key: str
    is_active: bool
    created_at: str