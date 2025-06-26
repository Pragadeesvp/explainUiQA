import { useState, useCallback } from 'react';
import { listFolders, listFiles, createFolder, uploadFile } from '@/services/file-storage.service';
import { Folder, File } from '@/types/file-storage.types';

export const useFileStorage = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // TODO: Integrate S3 for loading folders
  const loadFolders = useCallback(async (path: string) => {
    const folderNames = await listFolders(path);
    const newFolders = folderNames.map(name => ({ name, path: `${path}/${name}` }));
    setFolders(newFolders);
  }, []);

  // TODO: Integrate S3 for loading files
  const loadFiles = useCallback(async (path: string) => {
    const fileNames = await listFiles(path);
    const newFiles = fileNames.map(name => ({ name, path: `${path}/${name}`, type: name.split('.').pop() || '' }));
    setFiles(newFiles);
  }, []);

  // TODO: Integrate S3 for creating folders
  const handleCreateFolder = useCallback(
    async (path: string) => {
      const success = await createFolder(path);
      if (success) {
        await loadFolders(path);
      }
    },
    [loadFolders]
  );

  // TODO: Integrate S3 for uploading files
  const handleUploadFile = useCallback(
    async (path: string, file: File) => {
      const success = await uploadFile(path, file);
      if (success) {
        await loadFiles(path);
      }
    },
    [loadFiles]
  );

  return {
    folders,
    files,
    loadFolders,
    loadFiles,
    handleCreateFolder,
    handleUploadFile,
  };
};
