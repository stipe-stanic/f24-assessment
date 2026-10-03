import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Name cannot be empty or consist only of spaces")

        illegal_chars = r'[<>:"/\\|?*\x00]'
        if re.search(illegal_chars, v):
            raise ValueError("Name contains invalid characters")

        if v.strip('.') == "":
            raise ValueError("Name cannot consist only of periods")

        return v


class FolderCreate(ItemCreate):
    parent_id: Optional[int] = Field(default=None, ge=1)


class FileCreate(ItemCreate):
    folder_id: int = Field(..., ge=1)


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class FileResponse(BaseModel):
    id: int
    name: str
    folder_id: int

    model_config = ConfigDict(from_attributes=True)
