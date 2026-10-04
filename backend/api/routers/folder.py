from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from data import model, schema
from data.database import get_db


router = APIRouter()


@router.get("/folders", status_code=status.HTTP_200_OK, response_model=List[schema.FolderResponse])
async def get_folders(parent_id: Optional[int] = Query(None, ge=1), db: AsyncSession = Depends(get_db)):
    if parent_id is None:
        # Returns all root level folders
        query = select(model.Folder).where(model.Folder.parent_id.is_(None))
    else:
        # Check if parent folder exists
        parent_folder = await db.get(model.Folder, parent_id)
        if parent_folder is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Folder with id {parent_id} not found"
            )
        query = select(model.Folder).where(model.Folder.parent_id == parent_id)

    results = await db.execute(query)
    return results.scalars().all()


@router.post("/folders", status_code=status.HTTP_201_CREATED, response_model=schema.FolderResponse)
async def create_folder(folder: schema.FolderCreate, db: AsyncSession = Depends(get_db)):
    db_folder = model.Folder(name=folder.name, parent_id=folder.parent_id)  # type: ignore
    db.add(db_folder)

    try:
        await db.commit()
        await db.refresh(db_folder)
        return db_folder
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e.orig).lower() if e.orig else ""

        # Foreign Key Constraint Failure (Non-existent parent folder)
        if "foreign key" in err_msg or "parent'_id" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent folder with ID {folder.parent_id} does not exist."
            )

        # Unique Constraint Failure (Duplicate folder name in same parent)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A folder named '{folder.name}' already exists in this location."
        )


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: int = Path(..., ge=1), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(model.Folder).where(model.Folder.id == folder_id))
    db_folder = result.scalars().first()

    if not db_folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    # Deletes all nested folders and files
    await db.delete(db_folder)
    await db.commit()
