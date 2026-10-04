# Basic File Explorer

A containerized, full-stack web application that simulates a basic file system. It allows users to navigate, create, and delete folders and files through a minimal React frontend, backed by FastAPI and a PostgreSQL database.

## Architecture & Technologies

This project is built using multi-container architecture. Every layer operates in its own dedicated Docker container, orchestrated via Docker Compose:

*   **Frontend (React + Vite):** A minimal, user interface. The Vite server runs inside the container, serving the application to a browser while providing Hot Module Replacement (HMR) during development. 
*   **Backend (Python API):** Handles all business logic and database interactions. Dependency management is powered by [uv](https://github.com/astral-sh/uv) which is also used to resolve and install dependencies directly inside the backend Docker container.
*   **Data (PostgreSQL):** A relational database storing the file system's hierarchical state, utilizing self-referencing tables for nested folders.

## Core Specifications & Notes

*   **File Placement Rule:** **Files cannot exist at the root level.** The root level (`/home`) is strictly reserved for folders. A file *must* be created inside a parent folder.
*   **Decoupled API Fetching:** For cleaner separation of concerns, fetching folder contents is split into two distinct API requests: one dedicated to retrieving subfolders, and another for retrieving files. There is no "cumulated" request that pulls both simultaneously.
*   **Routing:** The application utilizes dynamic URL routing (`/home` for the root, `/folders/:folderId` for subdirectories).
*   **Tests:** The backend includes an automated test suite that validates the asynchronous database engine against a premade set of seeded database records to ensure data integrity and structural rules.

---

## Getting Started

### Prerequisites

You must have **Docker** installed and running in the background on your machine. 
*   [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) if you do not have it installed.

### Installation & Setup

1. **Navigate to the project root:**
   Open your terminal and change directories into the root of this project.
   ```bash
   cd /path/to/project-root
   ```

2. **Configure Environment Variables:**
   The project requires a `.env` file to configure database credentials and server settings. An example file is provided. Use your own values where needed.
   <br><br>
   Copy the key-value pairs from `.env.example` into a new file named `.env`:
   ```bash
   # On Mac/Linux:
   cp .env.example .env
   
   # On Windows (Command Prompt):
   copy .env.example .env
   ```
   *(Ensure the `.env` file is in the root directory alongside `docker-compose.yml`)*
     <br><br>
3. **Spin up the containers:**
   Use Docker Compose to build the images, install dependencies (via `uv` and `npm`), and start the services in the background (`-d`).
   ```bash
   docker compose up -d
   ```

4. **Access the Application:**
   *   **Frontend UI:** Open your browser and navigate to `http://localhost:port` (This will automatically redirect you to `http://localhost:port/home`).
   *   **Backend API Docs (Swagger):** Open `http://localhost:port/docs` to view and test the API endpoints interactively.

### Shutting Down

To stop the containers and free up system resources, run:
```bash
docker compose down
```
*(Note: Adding the `-v` flag will also destroy the database volume, wiping all created files and folders).*

---

## Testing

The project includes an automated testing suite focused on the database and API layers. 

Tests are designed to run against the **asynchronous database engine**. When the test suite initializes, it spins up a test database schema and populates it with a **premade set of database records** (fixtures). This ensures that operations like file creation, folder deletion, and cascading foreign-key constraints are tested in a predictable, reproducible state without touching main development data.

---
