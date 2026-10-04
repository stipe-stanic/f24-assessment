import React, { useState, useEffect } from 'react';
import { searchFiles, searchFolderFile } from '../services/api';

export default function SearchBar({ currentFolderId }) {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState('search_all'); // 'search_all' | 'search_folder'
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    // Reset state when switching search modes
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setResults([]);
        setHasSearched(false);
        setError(null);
    };

    // Prevent page reload when user presses Enter inside the form
    const handleSubmit = (e) => {
        e.preventDefault();
    };

    // Debounced search with AbortController for race condition protection
    useEffect(() => {
        const controller = new AbortController();
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 2) {
            setResults([]);
            setHasSearched(false);
            setIsSearching(false);
            setError(null);
            return;
        }

        // Handle searching within a folder while at root level
        if (mode === 'search_folder' && currentFolderId === null) {
            setResults([]);
            setHasSearched(false);
            setIsSearching(false);
            setError("Select a specific folder to perform a folder search.");
            return;
        }

        setIsSearching(true);
        setError(null);

        const delayDebounceFn = setTimeout(async () => {
            try {
                let response;
                const options = { signal: controller.signal };

                if (mode === 'search_folder') {
                    response = await searchFolderFile(trimmedQuery, currentFolderId, options);
                } else {
                    response = await searchFiles(trimmedQuery, options);
                }

                setResults(response.data || []);
                setHasSearched(true);
            } catch (err) {
                // Ignore errors caused by explicit request cancellation
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;

                console.error("File search failed", err);
                setError(err.message || "Search failed. Please try again.");
                setResults([]);
                setHasSearched(false);
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(delayDebounceFn);
            controller.abort(); // Cancel pending network request if query, mode, or folder changes
        };
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder={"Type to search..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: '8px', width: '250px' }}
                />
            </form>

            {/* Loading Indicator */}
            {isSearching && (
                <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Searching...</p>
            )}

            {/* Error Message */}
            {error && (
                <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '8px' }}>
                    {error}
                </p>
            )}

            {/* Search Results Dropdown */}
            {!isSearching && !error && results.length > 0 && (
                <ul style={{ border: '1px solid #ccc', listStyle: 'none', padding: '10px', width: '320px', marginTop: '8px' }}>
                    {results.map(file => (
                        <li key={`search-file-${file.id}`} style={{ marginBottom: '5px' }}>
                            📄 {file.name} <small style={{ color: '#666' }}>(Folder: {file.folder_id ?? 'Root'})</small>
                        </li>
                    ))}
                </ul>
            )}

            {/* Empty Results State */}
            {!isSearching && !error && hasSearched && results.length === 0 && query.trim().length >= 2 && (
                <p style={{ color: 'gray', fontSize: '14px', marginTop: '8px' }}>
                    No {mode === 'search_folder' ? 'folder' : ''} files found.
                </p>
            )}
        </div>
    );
}