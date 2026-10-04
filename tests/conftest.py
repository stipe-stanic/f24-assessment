import pytest
import pytest_asyncio
from testcontainers.community.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from httpx2 import AsyncClient, ASGITransport

from api.main import app
from data.database import Base, get_db
from data.model import Folder, File


@pytest.fixture(scope="session")
def postgres_container():
    """Starts the container (synchronous)."""
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


@pytest_asyncio.fixture(scope="function")
async def engine(postgres_container):
    """Creates the async engine."""
    # testcontainers defaults to psycopg2, we override it to asyncpg
    url = postgres_container.get_connection_url(driver="asyncpg")
    engine = create_async_engine(url)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_setup(engine):
    """Creates schema, seeds data asynchronously, and tears down."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestingSession = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

    async with TestingSession() as session:
        # --- SEED DATA SETUP ---
        docs_folder = Folder(name="Documents", parent_id=None)
        notes_folder = Folder(name="Notes", parent_id=None)
        session.add_all([docs_folder, notes_folder])
        await session.flush()

        work_folder = Folder(name="Work", parent_id=docs_folder.id)
        session.add(work_folder)
        await session.flush()

        file1 = File(name="resume_01.pdf", folder_id=docs_folder.id)
        file2 = File(name="resume_02.pdf", folder_id=docs_folder.id)
        file3 = File(name="report.docx", folder_id=work_folder.id)
        file4 = File(name="resume_final.pdf", folder_id=work_folder.id)
        file5 = File(name="wishlist.txt", folder_id=notes_folder.id)

        session.add_all([file1, file2, file3, file4, file5])
        await session.commit()

        yield session

    # Drop tables after test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(engine, db_setup):
    """Async client using httpx2, connected to the FastAPI app."""

    TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

    async def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        except Exception as e:
            print(f"\nError: {repr(e)}\n")
            raise
        finally:
            # Catch and ignore the asyncpg rollback error
            try:
                await session.close()
            except Exception:
                pass

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
