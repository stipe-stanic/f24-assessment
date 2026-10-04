import React, { useState } from 'react';

export default function CreateItem({
    onCreateFolder,
    onCreateFile,
    disableFileCreation,
    disabled = false
}) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const trimmedName = name.trim();
    const isInputEmpty = !trimmedName;

    const handleFolder = async () => {
        if (isInputEmpty || disabled || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onCreateFolder(trimmedName);
            setName(''); // Only clear input on SUCCESS
        } catch {
            // Error is handled by parent App component, keep input intact so user can edit
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFile = async () => {
        if (isInputEmpty || disableFileCreation || disabled || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onCreateFile(trimmedName);
            setName(''); // Only clear input on SUCCESS
        } catch {
            // Keep input intact on failure
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFolderDisabled = isInputEmpty || disabled || isSubmitting;
    const isFileDisabled = isInputEmpty || disableFileCreation || disabled || isSubmitting;

    return (
        <div style={{ marginBottom: '20px' }}>
            <input
                type="text"
                placeholder="New item name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled || isSubmitting}
                style={{ padding: '8px', marginRight: '10px' }}
            />
            <button
                type="button"
                onClick={handleFolder}
                disabled={isFolderDisabled}
                style={{
                    padding: '8px',
                    cursor: isFolderDisabled ? 'not-allowed' : 'pointer'
                }}
            >
                {isSubmitting ? 'Creating...' : '+ Folder'}
            </button>
            <button
                type="button"
                onClick={handleFile}
                disabled={isFileDisabled}
                title={disableFileCreation ? "File cannot be created at the root level" : ""}
                style={{
                    padding: '8px',
                    marginLeft: '5px',
                    cursor: isFileDisabled ? 'not-allowed' : 'pointer',
                }}
            >
                + File
            </button>
        </div>
    );
}
