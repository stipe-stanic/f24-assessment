import React, { useState, useEffect } from 'react';
import { searchFiles, searchFolderFile } from '../services/api';

export default function SearchBar({ currentFolderId }) {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState('search_all'); // 'search_all' | 'search_folder'
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Reset state when switching search modes
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setResults([]);
        setHasSearched(false);
    };

    const executeSearch = async (searchQuery) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        try {
            let response;
            if (mode === 'search_folder') {
                response = await searchFolderFile(searchQuery, currentFolderId);
            } else {
                response = await searchFiles(searchQuery);
            }
            setResults(response.data || []);
            setHasSearched(true); // Mark search as completed
        } catch (error) {
            console.error("File search failed", error);
            setResults([]);
            setHasSearched(true);
        }
    };

    // Debounced automatic search on typing
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            executeSearch(query);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, mode, currentFolderId]);

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <label style={{ marginRight: '15px', cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="searchMode"
                        value="search_all"
                        checked={mode === 'search_all'}
                        onChange={() => handleModeChange('search_all')}
                    />
                    Search All
                </label>
                <label style={{ cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="searchMode"
                        value="search_folder"
                        checked={mode === 'search_folder'}
                        onChange={() => handleModeChange('search_folder')}
                    />
                    Search Folder
                </label>
            </div>

            <form style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder={mode === 'search_all' ? "Type to search..." : "Type folder filename..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: '8px', width: '250px' }}
                />
            </form>

            {/* Search Results Dropdown */}
            {results.length > 0 && (
                <ul style={{ border: '1px solid #ccc', listStyle: 'none', padding: '10px', width: '320px', marginTop: '8px' }}>
                    {results.map(file => (
                        <li key={file.id} style={{ marginBottom: '5px' }}>
                            📄 {file.name} <small style={{ color: '#666' }}>(Folder: {file.folder_id})</small>
                        </li>
                    ))}
                </ul>
            )}

            {hasSearched && results.length === 0 && query.trim().length >= 2 && (
                <p style={{ color: 'gray', fontSize: '14px', marginTop: '8px' }}>
                    No {mode === 'search_folder' ? 'folder' : ''} files found.
                </p>
            )}
        </div>
    );
}