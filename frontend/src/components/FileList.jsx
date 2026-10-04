import React from 'react';

export default function FileList({ folders, files, onNavigate, onDelete }) {
    return (
        <div style={{ marginTop: '20px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {folders.map(folder => (
                    <li key={`folder-${folder.id}`} style={{ margin: '10px 0' }}>
                        <span
                            onClick={() => onNavigate(folder.id)}
                            style={{ cursor: 'pointer', fontWeight: 'bold', marginRight: '15px' }}
                        >
                            📁 {folder.name}
                        </span>
                        <button onClick={() => onDelete('folder', folder.id)}>Delete</button>
                    </li>
                ))}

                {files.map(file => (
                    <li key={`file-${file.id}`} style={{ margin: '10px 0' }}>
                        <span style={{ marginRight: '15px' }}>📄 {file.name}</span>
                        <button onClick={() => onDelete('file', file.id)}>Delete</button>
                    </li>
                ))}

                {folders.length === 0 && files.length === 0 && (
                    <li style={{ color: 'gray' }}>This folder is empty.</li>
                )}
            </ul>
        </div>
    );
}
