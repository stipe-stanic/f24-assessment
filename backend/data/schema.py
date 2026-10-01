from pydantic import BaseModel, ConfigDict
from typing import Optional


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None


class FileCreate(BaseModel):
    name: str
    folder_id: int


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    model_config: ConfigDict = ConfigDict(from_attributes=True)


class FileResponse(BaseModel):
    id: int
    name: str
    folder_id: int

    model_config = ConfigDict(from_attributes=True)
