import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api'
});

export const getFolders = (parentId = null) =>
    api.get('/folders', { params: { parent_id: parentId } });

export const getFiles = (folderId = null) =>
    api.get('/files', { params: { folder_id: folderId } });

export const createFolder = (name, parentId = null) =>
    api.post('/folders', { name, parent_id: parentId });

export const createFile = (name, folderId) =>
    api.post('/files', { name, folder_id: folderId });

export const deleteFolder = (id) => api.delete(`/folders/${id}`);
export const deleteFile = (id) => api.delete(`/files/${id}`);

export const searchFolderFile = (query, folderId = null) =>
    api.get('/files/search_folder', { params: { query, folder_id: folderId || undefined } });
export const searchFiles = (query) =>
    api.get('/files/search_all', { params: { query } });