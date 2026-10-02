import React, { useState } from 'react';

export default function CreateItem({ onCreateFolder, onCreateFile, disableFileCreation }) {
    const [name, setName] = useState('');

    const handleFolder = () => {
        onCreateFolder(name);
        setName('');
    };

    const handleFile = () => {
        onCreateFile(name);
        setName('');
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <input
                type="text"
                placeholder="New item name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ padding: '8px', marginRight: '10px' }}
            />
            <button onClick={handleFolder} disabled={!name} style={{ padding: '8px' }}>+ Folder</button>
            <button
                onClick={handleFile}
                // Disabled if input is empty OR if we are at the root level
                disabled={!name || disableFileCreation}
                title={disableFileCreation ? "File cannot be created at the root level" : ""}
                style={{
                    padding: '8px',
                    marginLeft: '5px',
                    cursor: disableFileCreation ? 'not-allowed' : 'pointer',
                    opacity: disableFileCreation ? 0.6 : 1
                }}
            >
                + File
            </button>
        </div>
    );
}