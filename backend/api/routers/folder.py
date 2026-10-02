from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.data import model, schema
from backend.data.database import get_db


router = APIRouter()


@router.get("/folders", response_model=List[schema.FolderResponse])
async def get_folders(parent_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    if parent_id is None:
        query = select(model.Folder).filter(model.Folder.parent_id.is_(None))
    else:
        query = select(model.Folder).filter(model.Folder.parent_id == parent_id)

    results = await db.execute(query)
    return results.scalars().all()


@router.post("/folders", response_model=schema.FolderResponse)
async def create_folder(folder: schema.FolderCreate, db: AsyncSession = Depends(get_db)):
    db_folder = model.Folder(name=folder.name, parent_id=folder.parent_id)  # type: ignore
    db.add(db_folder)
    await db.commit()
    await db.refresh(db_folder)
    return db_folder


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(model.Folder).filter(model.Folder.id == folder_id))
    db_folder = result.scalars().first()

    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Deletes all nested folders and files
    await db.delete(db_folder)
    await db.commit()

    return {"message": "Folder deleted"}
