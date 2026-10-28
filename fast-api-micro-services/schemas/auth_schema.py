from pydantic import BaseModel

class TokenRequest(BaseModel):
    api_key: str
    api_secret: str

class TokenResponse(BaseModel):
    token: str