from pydantic import BaseModel


class SecurityPlaceholder(BaseModel):
    enabled: bool = False
