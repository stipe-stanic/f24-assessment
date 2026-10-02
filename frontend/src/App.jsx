import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import CreateItem from './components/CreateItem';
import FileList from './components/FileList';
import * as api from './services/api';

export default function App() {
    const [currentFolder, setCurrentFolder] = useState(null); // null = root directory
    const [history, setHistory] = useState([]);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    const loadContents = async (folderId) => {
        try {
            const [folderRes, fileRes] = await Promise.all([
                api.getFolders(folderId),
                api.getFiles(folderId)
            ]);
            setFolders(folderRes.data);
            setFiles(fileRes.data);
        } catch (error) {
            console.error("Failed to load contents", error);
        }
    };

    // Reload contents whenever currentFolder changes
    useEffect(() => {
        loadContents(currentFolder).catch(console.error);
    }, [currentFolder]);

    const handleNavigate = (folderId) => {
        setHistory([...history, currentFolder]);
        setCurrentFolder(folderId);
    };

    const handleGoBack = () => {
        const newHistory = [...history];
        const prevFolder = newHistory.pop();
        setHistory(newHistory);
        setCurrentFolder(prevFolder !== undefined ? prevFolder : null);
    };

    const handleCreateFolder = async (name) => {
        await api.createFolder(name, currentFolder);
        await loadContents(currentFolder);
    };

    const handleCreateFile = async (name) => {
        await api.createFile(name, currentFolder);
        await loadContents(currentFolder);
    };

    const handleDelete = async (type, id) => {
        if (type === 'folder') {
            await api.deleteFolder(id);
        } else {
            await api.deleteFile(id);
        }
        await loadContents(currentFolder);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px' }}>
            <h2>Basic File System</h2>

            <SearchBar currentFolderId={currentFolder} />

            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
                <button
                    onClick={handleGoBack}
                    disabled={history.length === 0}
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
            />

            <hr />

            <FileList
                folders={folders}
                files={files}
                onNavigate={handleNavigate}
                onDelete={handleDelete}
            />
        </div>
    );
}