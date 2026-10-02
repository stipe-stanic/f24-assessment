from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from data.database import Base


class Folder(Base):
    __tablename__ = "folder"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
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


class File(Base):
    __tablename__ = "file"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    folder_id = Column(Integer, ForeignKey("folder.id", ondelete="CASCADE"), nullable=False)

    folder = relationship("Folder", back_populates="files")
