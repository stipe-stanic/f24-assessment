from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from data import model, schema
from data.database import get_db


router = APIRouter()


@router.get("/files", status_code=200, response_model=List[schema.FileResponse])
async def get_files(folder_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    if folder_id is None:
        return []

    query = select(model.File).where(model.File.folder_id == folder_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/files", status_code=201, response_model=schema.FileResponse)
async def create_file(file: schema.FileCreate, db: AsyncSession = Depends(get_db)):
    db_file = model.File(name=file.name, folder_id=file.folder_id)
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    return db_file


@router.delete("/files/{file_id}", status_code=204)
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(model.File).where(model.File.id == file_id))
    db_file = result.scalars().first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    await db.delete(db_file)
    await db.commit()
    return {"message": "File deleted"}


@router.get("/files/search_folder", status_code=200, response_model=List[schema.FileResponse])
async def search_folder(query: str, folder_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    if folder_id is None:
        return []

    stmt = (
        select(model.File)
        .where(model.File.folder_id == folder_id)
        .where(model.File.name.ilike(f"{query}%")).limit(10)
    )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/files/search_all", status_code=200, response_model=List[schema.FileResponse])
async def search_all(query: str, db: AsyncSession = Depends(get_db)):
    if not query:
        return []

    stmt = select(model.File).where(model.File.name.ilike(f"{query}%")).limit(10)
    result = await db.execute(stmt)
    return result.scalars().all()
