async def test_get_root_folders(client):
    folders_response = await client.get("/api/folders")
    files_response = await client.get("/api/files")

    assert folders_response.status_code == 200
    assert files_response.status_code == 200

    assert isinstance(folders_response.json(), list)

    # No files at root level
    files = files_response.json()
    assert isinstance(files, list)
    assert len(files) == 0


async def test_get_subfolder_contents(client):
    target_folder_id = 1

    folders_response = await client.get("/api/folders", params={"folder_id": target_folder_id})
    files_response = await client.get("/api/files", params={"folder_id": target_folder_id})

    assert folders_response.status_code == 200
    assert files_response.status_code == 200

    folders = folders_response.json()
    assert isinstance(folders, list)
    assert len(folders) == 1

    files = files_response.json()
    assert isinstance(files, list)
    assert len(files) == 2


async def test_search_files(client):
    # Test searching across all folders
    search_all_res = await client.get("/api/files/search_all", params={"query": "resume"})
    assert search_all_res.status_code == 200

    files = search_all_res.json()
    assert isinstance(files, list)
    assert len(files) == 3

    # Test searching within a specific folder
    search_folder_res = await client.get(
        "/api/files/search_folder",
        params={"query": "resume", "folder_id": 1}
    )
    assert search_folder_res.status_code == 200

    files = search_folder_res.json()
    assert isinstance(files, list)
    assert len(files) == 2


async def test_create_and_delete_folder(client):
    create_res = await client.post("/api/folders", json={"name": "Test Folder", "parent_id": None})
    assert create_res.status_code == 201

    created_folder = create_res.json()
    assert created_folder["name"] == "Test Folder"

    delete_res = await client.delete(f"/api/folders/{created_folder['id']}")
    assert delete_res.status_code == 204


async def test_create_and_delete_file(client):
    file_res = await client.post("/api/files", json={"name": "test_file.txt", "folder_id": 1})
    assert file_res.status_code == 201

    created_file = file_res.json()
    assert created_file["name"] == "test_file.txt"

    delete_res = await client.delete(f"/api/files/{created_file['id']}")
    assert delete_res.status_code == 204


async def test_delete_folder_deletes_all_contents(client):
    """ Deleting a parent folder automatically removes its nested files and subfolders."""
    folder_id = 1

    # Delete work folder
    delete_res = await client.delete(f"/api/folders/{folder_id}")
    assert delete_res.status_code == 204

    # Verify the contents under the deleted folder return empty lists
    folders_in_deleted = await client.get("/api/folders", params={"folder_id": folder_id})
    files_in_deleted = await client.get("/api/files", params={"folder_id": folder_id})

    assert folders_in_deleted.status_code == 200
    assert files_in_deleted.status_code == 200

    assert folders_in_deleted.json() == []
    assert files_in_deleted.json() == []
