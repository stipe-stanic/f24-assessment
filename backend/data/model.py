from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from data.database import Base


class Folder(Base):
    __tablename__ = "folder"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("folder.id", ondelete="CASCADE"), nullable=True)

    # Removing a folder removes all nested folders
    subfolders = relationship(
        "Folder",
        back_populates="parent",
        passive_deletes=True,
        cascade="all, delete",
    )

    parent = relationship(
        "Folder",
        back_populates="subfolders",
        remote_side=[id],
    )

    # Removing a folder removes all its files
    files = relationship(
        "File",
        back_populates="folder",
        passive_deletes=True,
        cascade="all, delete",
    )

    __table_args__ = (
        # Prevent folders with the same name in the same parent folder
        UniqueConstraint('name', 'parent_id', name='uq_folder_name_parent'),
        # Prevent a folder from being its own parent
        CheckConstraint('id != parent_id', name='ck_folder_parent_not_self')
    )


class File(Base):
    __tablename__ = "file"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    folder_id = Column(Integer, ForeignKey("folder.id", ondelete="CASCADE"), nullable=False)

    folder = relationship("Folder", back_populates="files")

    __table_args__ = (
        # Prevent files with the same name in the same folder
        UniqueConstraint('name', 'folder_id', name='uq_file_name_folder'),
    )
