from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from ...data import model, schema
from ...data.database import get_db


router = APIRouter()


@router.post("/files", response_model=schema.FileResponse)
async def create_file(file: schema.FileCreate, db: AsyncSession = Depends(get_db)):
    db_file = model.File(name=file.name, folder_id=file.folder_id)
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    return db_file


@router.delete("/files/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(model.File).filter(model.File.id == file_id))
    db_file = result.scalars().first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    await db.delete(db_file)
    await db.commit()
    return {"message": "File deleted"}


@router.get("/files/search", response_model=List[schema.FileResponse])
async def search_exact(name:str, folder_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(model.File).filter(model.File.name == name)
    if folder_id is not None:
        query = query.filter(model.File.folder_id == folder_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/files/autocomplete", response_model=List[schema.FileResponse])
async def autocomplete(query: str, db: AsyncSession = Depends(get_db)):
    if not query:
        return []

    stmt = select(model.File).filter(model.File.name.ilike(f"{query}%")).limit(10)
    result = await db.execute(stmt)
    return result.scalars().all()
