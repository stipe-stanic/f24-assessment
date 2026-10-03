import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import CreateItem from './components/CreateItem';
import FileList from './components/FileList';
import * as api from './services/api';

export default function App() {
    const [currentFolder, setCurrentFolder] = useState(null); // null = root level
    const [history, setHistory] = useState([]);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    // UI state for UX and error handling
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper to safely extract error messages across different error structures
    const getErrorMessage = (err, fallback) =>
        err.response?.data?.detail || err.message || fallback;

    // Use isStillValid to prevent race conditions.
    const loadContents = useCallback(async (folderId, isStillValid = () => true) => {
        setIsLoading(true);
        setError(null);
        try {
            const [folderRes, fileRes] = await Promise.all([
                api.getFolders(folderId),
                api.getFiles(folderId)
            ]);
            if (isStillValid()) {
                // Safeguard against non-array response payloads
                setFolders(Array.isArray(folderRes.data) ? folderRes.data : []);
                setFiles(Array.isArray(fileRes.data) ? fileRes.data : []);
            }
        } catch (err) {
            if (isStillValid()) {
                console.error("Failed to load contents", err);
                setError(getErrorMessage(err, "Failed to load folder contents."));
                setFolders([]);
                setFiles([]);
            }
        } finally {
            if (isStillValid()) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let ignore = false;

        loadContents(currentFolder, () => !ignore);

        return () => {
            // If currentFolder changes, this flips to true, stopping the state update
            // Discard the data if it doesn't finish loading before user navigates away
            ignore = true;
        };
    }, [currentFolder, loadContents]);

    const handleNavigate = (folderId) => {
        setError(null);
        setHistory([...history, currentFolder]);
        setCurrentFolder(folderId);
    };

    const handleGoBack = () => {
        setError(null);
        const newHistory = [...history];
        const prevFolder = newHistory.pop();
        setHistory(newHistory);
        setCurrentFolder(prevFolder !== undefined ? prevFolder : null);
    };

    const handleCreateFolder = async (rawName) => {
        const name = rawName?.trim();
        if (!name) {
            setError("Folder name cannot be empty.");
            return;
        }

        setError(null);
        try {
            await api.createFolder(name, currentFolder);
            await loadContents(currentFolder);
        } catch (err) {
            console.error("Failed to create folder", err);
            const msg = getErrorMessage(err, "Could not create folder.");
            setError(msg);
            throw new Error(msg); // Rethrow so CreateItem knows NOT to clear the input
        }
    };

    const handleCreateFile = async (rawName) => {
        const name = rawName?.trim();
        if (!name) {
            setError("File name cannot be empty.");
            return;
        }

        setError(null);
        try {
            await api.createFile(name, currentFolder);
            await loadContents(currentFolder);
        } catch (err) {
            console.error("Failed to create file", err);
            const msg = getErrorMessage(err, "Could not create file.");
            setError(msg);
            throw new Error(msg); // Rethrow so CreateItem knows NOT to clear the input
        }
    };

    const handleDelete = async (type, id) => {
        setError(null);
        try {
            if (type === 'folder') {
                await api.deleteFolder(id);
            } else {
                await api.deleteFile(id);
            }
            await loadContents(currentFolder);
        } catch (err) {
            console.error(`Failed to delete ${type}`, err);
            setError(getErrorMessage(err, `Failed to delete ${type}.`));
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px' }}>
            <h2>Basic File System</h2>

            {/* Error Display Alert */}
            {error && (
                <div style={{
                    padding: '10px 15px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #fca5a5'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <SearchBar currentFolderId={currentFolder} />

            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                <button
                    onClick={handleGoBack}
                    disabled={history.length === 0 || isLoading}
                    style={{ marginRight: '15px' }}
                >
                    Back
                </button>
                <span>Path: {currentFolder === null ? 'Root' : `Folder ID: ${currentFolder}`}</span>
            </div>

            <CreateItem
                onCreateFolder={handleCreateFolder}
                onCreateFile={handleCreateFile}
                disableFileCreation={currentFolder === null}
                disabled={isLoading}
            />

            <hr />

            {isLoading ? (
                <p style={{ color: '#666' }}>Loading contents...</p>
            ) : (
                <FileList
                    folders={folders}
                    files={files}
                    onNavigate={handleNavigate}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}