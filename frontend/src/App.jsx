import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import CreateItem from './components/CreateItem';
import FileList from './components/FileList';
import * as api from './services/api';

function FileExplorer() {
    // Extract folderId from URL
    const { folderId } = useParams();
    const navigate = useNavigate();

    const currentFolder = folderId ? parseInt(folderId, 10) : null;

    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    // UI state for UX and error handling
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper to safely extract error messages across different error structures
    const getErrorMessage = (err, fallbackMessage = "An error occurred.") => {
    const detail = err.response?.data?.detail;

    if (detail) {
        if (Array.isArray(detail) && detail.length > 0) {
            return detail[0].msg;
        }

        if (typeof detail === "string") {
            return detail;
        }
    }

    return err.message || fallbackMessage;
};

    const loadContents = useCallback(async (targetFolderId, isStillValid = () => true) => {
        setIsLoading(true);
        setError(null);
        try {
            const [folderRes, fileRes] = await Promise.all([
                api.getFolders(targetFolderId),
                api.getFiles(targetFolderId)
            ]);
            if (isStillValid()) {
                // Safeguard against non-array response payloads
                setFolders(Array.isArray(folderRes.data) ? folderRes.data : []);
                setFiles(Array.isArray(fileRes.data) ? fileRes.data : []);
            }
        } catch (err) {
            if (isStillValid()) {
                console.error("Failed to load contents", err);

                // Handle attempts to access non-existent/deleted folders (e.g. via browser back/forward button)
                const isNotFound =
                    err.status === 404 ||
                    err.response?.status === 404 ||
                    err.message?.toLowerCase().includes("not found");
                if (isNotFound && targetFolderId !== null) {
                    setError("The requested folder no longer exists.");
                    // Replace dead route in browser history so user doesn't get stuck in a back-button loop
                    navigate('/home', { replace: true });
                } else {
                    setError(getErrorMessage(err, "Failed to load folder contents."));
                    setFolders([]);
                    setFiles([]);
                }
            }
        } finally {
            if (isStillValid()) {
                setIsLoading(false);
            }
        }
    }, [navigate]);

    // Fetch data whenever currentFolder changes
    useEffect(() => {
        let ignore = false;
        loadContents(currentFolder, () => !ignore);

        return () => {
            // If currentFolder changes, this flips to true, stopping the state update
            // Discard the data if it doesn't finish loading before user navigates away
            ignore = true;
        };
    }, [currentFolder, loadContents]);

    const handleNavigate = (id) => {
        setError(null);
        navigate(`/folders/${id}`);
    };

    const handleGoBack = () => {
        setError(null);
        navigate(-1); // Triggers standard browser back navigation
    };

    const handleGoToRoot = () => {
        setError(null);
        navigate('/home');
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

                // If user deletes the folder currently being viewed, redirect to home
                if (id === currentFolder) {
                    navigate('/home', { replace: true });
                    return;
                }
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
                    style={{ marginRight: '10px' }}
                    disabled={isLoading}
                >
                    Back
                </button>
                <button
                    onClick={handleGoToRoot}
                    disabled={currentFolder === null || isLoading}
                    style={{ marginRight: '15px' }}
                >
                    Home
                </button>
                <span>Path: {currentFolder === null ? 'Home' : `Folder ID: ${currentFolder}`}</span>
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

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<FileExplorer />} />

                {/* Subfolder view */}
                <Route path="/folders/:folderId" element={<FileExplorer />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
