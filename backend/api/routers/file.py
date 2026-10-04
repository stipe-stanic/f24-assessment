from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from data import model, schema
from data.database import get_db


router = APIRouter()


@router.get("/files", status_code=status.HTTP_200_OK, response_model=List[schema.FileResponse])
async def get_files(folder_id: Optional[int] = Query(None, ge=1), db: AsyncSession = Depends(get_db)):
    if folder_id is None:
        return []

    query = select(model.File).where(model.File.folder_id == folder_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/files", status_code=status.HTTP_201_CREATED, response_model=schema.FileResponse)
async def create_file(file: schema.FileCreate, db: AsyncSession = Depends(get_db)):
    db_file = model.File(name=file.name, folder_id=file.folder_id)
    db.add(db_file)

    try:
        await db.commit()
        await db.refresh(db_file)
        return db_file
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e.orig).lower() if e.orig else ""

        # Foreign key constraint failure (Folder does not exist)
        if "foreign key" in err_msg or "folder_id" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target folder with ID {file.folder_id} does not exist."
            )

        # Unique constraint failure (Duplicate file name in folder)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A file named '{file.name}' already exists in this folder."
        )


@router.get("/files/search_folder", status_code=status.HTTP_200_OK, response_model=List[schema.FileResponse])
async def search_folder(
        query: str = Query(..., min_length=1, max_length=255),
        folder_id: Optional[int] = Query(None, ge=1),
        db: AsyncSession = Depends(get_db)
):
    if folder_id is None:
        return []

    # Escape SQL wildcard characters
    query = query.replace("%", r"\%").replace("_", r"\_")

    stmt = (
        select(model.File)
        .where(model.File.folder_id == folder_id)
        .where(model.File.name.ilike(f"{query}%"))
        .limit(10)
    )

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/files/search_all", status_code=status.HTTP_200_OK, response_model=List[schema.FileResponse])
async def search_all(
        query: str = Query(..., min_length=1, max_length=255),
        db: AsyncSession = Depends(get_db)
):
    if not query:
        return []

    # Escape SQL wildcard characters
    query = query.replace("%", r"\%").replace("_", r"\_")

    stmt = select(model.File).where(model.File.name.ilike(f"{query}%")).limit(10)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: int = Path(..., ge=1), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(model.File).where(model.File.id == file_id))
    db_file = result.scalars().first()

    if not db_file:
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT, detail="File with ID: {file_id} not found")

    await db.delete(db_file)
    await db.commit()
