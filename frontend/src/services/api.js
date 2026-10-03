import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Converts null/empty values to `undefined` so Axios omits them from query strings
const cleanParams = (params) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
        }
    }
    return cleaned;
};

// Normalizes error messages for easier consumption in components
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Formats FastAPI HTTP error response or network error
        const message =
            error.response?.data?.detail ||
            error.message ||
            "An unexpected network error occurred.";

        return Promise.reject(new Error(typeof message === 'object' ? JSON.stringify(message) : message));
    }
);

export const getFolders = (parentId = null, options= {}) =>
    api.get('/folders', { params: cleanParams({ parent_id: parentId }), ...options });

export const getFiles = (folderId = null, options = {}) =>
    api.get('/files', { params: cleanParams({ folder_id: folderId }), ...options });

export const createFolder = (name, parentId = null) =>
    api.post('/folders', { name: name?.trim(), parent_id: parentId || null });

export const createFile = (name, folderId) =>
    api.post('/files', { name: name?.trim(), folder_id: folderId });

export const deleteFolder = (id) => api.delete(`/folders/${id}`);
export const deleteFile = (id) => api.delete(`/files/${id}`);

export const searchFolderFile = (query, folderId = null, options = {}) =>
    api.get('/files/search_folder', {
        params: cleanParams({ query: query?.trim(), folder_id: folderId }),
        ...options
    });

export const searchFiles = (query, options = {}) =>
    api.get('/files/search_all', {
        params: cleanParams({ query: query?.trim() }),
        ...options
    });
