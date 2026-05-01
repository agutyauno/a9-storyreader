import { supabase } from './supabaseClient';
import { fileToBase64 } from '../utils/fileUtils';

/**
 * Maps asset type and category to the correct GitHub folder path.
 * @param {string} type - 'image', 'audio', 'video'
 * @param {string} category - 'background', 'thumbnail', 'banner', 'bgm', 'sfx', 'PV', 'char_avatar', 'character', 'story_image'
 * @returns {string}
 */
export const getFolderPath = (type, category) => {
    if (type === 'image') {
        if (category === 'background') return 'images/backgrounds';
        if (category === 'thumbnail') return 'images/thumbnails';
        if (category === 'banner') return 'images/banners';
        if (category === 'char_avatar') return 'images/char_avatars';
        if (category === 'character') return 'images/characters';
        if (category === 'gallery') return 'images/story_images';
        if (category === 'wallpaper') return 'images/wallpapers';
        return 'images/thumbnails';
    }
    if (type === 'audio') {
        if (category === 'bgm') return 'audio/bgm';
        if (category === 'sfx') return 'audio/sfx';
        return 'audio';
    }
    if (type === 'video') {
        return 'video';
    }
    return 'assets/uploads';
};

/**
 * Uploads a file to GitHub via Supabase Edge Function 'github-manager'.
 * @param {File} file 
 * @param {string} folderPath 
 * @returns {Promise<{success: boolean, path: string, url: string}>}
 */
export const uploadFileToGithub = async (file, folderPath, customFileName = null) => {
    try {
        const contentBase64 = await fileToBase64(file);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
        }

        // Determine final filename: custom (if provided) + its detected extension
        let finalFileName = file.name;
        if (customFileName) {
            const ext = file.name.split('.').pop();
            finalFileName = `${customFileName}.${ext}`;
        }

        const { data, error } = await supabase.functions.invoke('github-manager', {
            body: {
                action: 'save',
                folderPath: folderPath,
                fileName: finalFileName,
                contentBase64: contentBase64,
                branch: 'main'
            }
        });

        // Remove local fallback to enforce strict GitHub uploads as per user requirement.
        if (error || !data?.success) {
            console.error('GitHub upload failed:', error || data?.error);

            let errorMessage = error?.message || data?.error || 'GitHub upload failed';

            // Handle generic Supabase Edge Function error often caused by payload/timeout size
            if (errorMessage.includes('non-2xx status code') || errorMessage.includes('fetch failed')) {
                errorMessage = 'Lỗi kết nối hoặc tệp quá lớn (vượt giới hạn Edge Function). Hãy thử tệp dung lượng nhỏ hơn (< 15MB).';
            }
            if (errorMessage.includes('too large')) {
                errorMessage = 'Tệp quá lớn không thể upload qua GitHub API.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }

        // Standardize the relative path with a leading slash
        const relativePath = data.path.startsWith('/') ? data.path : `/${data.path}`;
        const rawUrl = `https://raw.githubusercontent.com/agutyauno/a9sr-data/main${relativePath}`;

        return {
            success: true,
            path: relativePath,
            url: rawUrl
        };
    } catch (err) {
        console.error('Error in uploadFileToGithub:', err);
        return {
            success: false,
            error: err.message || 'Error connecting to upload service'
        };
    }
};
/**
 * Deletes a file from GitHub via Supabase Edge Function 'github-manager'.
 * @param {string} url - The full URL of the asset to delete.
 */
export const deleteFileFromGithub = async (url) => {
    if (!url) return { success: true };

    // Extract path from URL: https://raw.githubusercontent.com/agutyauno/a9sr-data/main/path/to/file
    // Or handle it if it is already a relative path /path/to/file
    let fullPath = url.startsWith('/') ? url.slice(1) : url;

    if (url.includes('githubusercontent.com') || url.includes('cdn.jsdelivr.net')) {
        const repoMarker = url.includes('/main/') ? '/main/' : (url.includes('@main/') ? '@main/' : null);
        if (repoMarker) {
            fullPath = url.split(repoMarker)[1];
        } else {
            // Fallback for other GitHub/JsDelivr structures
            const parts = url.split('/');
            const branchIndex = parts.findIndex(p => p === 'main' || p.includes('@main'));
            if (branchIndex !== -1) {
                fullPath = parts.slice(branchIndex + 1).join('/');
            }
        }
    }

    // Split fullPath into folderPath and fileName as required by github-manager edge function
    const pathParts = fullPath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Unauthorized');

        const { data, error } = await supabase.functions.invoke('github-manager', {
            body: {
                action: 'delete',
                folderPath: folderPath,
                fileName: fileName,
                // The edge function has a strict check: if (!action || !fileName || !rawBase64) return 400
                // We must provide a dummy contentBase64 even for delete action.
                contentBase64: 'ZGVsZXRl',
                branch: 'main'
            }
        });

        if (error || !data?.success) {
            console.error('GitHub delete failed:', error || data?.error);
            return {
                success: false,
                error: (error?.message || data?.error || 'GitHub delete failed')
            };
        }

        return { success: true };
    } catch (err) {
        console.error('Error in deleteFileFromGithub:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Uploads multiple files to GitHub in a single commit via 'bulk_save' action.
 * @param {Array<{file: File, folderPath: string, customFileName: string}>} fileItems 
 * @param {string} branch 
 * @returns {Promise<{success: boolean, commitUrl?: string, files: Array<{path: string, url: string}>}>}
 */
export const uploadFilesToGithub = async (fileItems, branch = 'main') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Unauthorized');

        // Convert all files to base64 and prepare payload
        const preparedFiles = await Promise.all(fileItems.map(async (item) => {
            const b64 = await fileToBase64(item.file);

            // Determine filename
            let fileName = item.file.name;
            if (item.customFileName) {
                const ext = item.file.name.split('.').pop();
                fileName = `${item.customFileName}.${ext}`;
            }

            const cleanFolder = (item.folderPath || '').replace(/\/$/, '').replace(/^\//, '');
            const fullPath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

            return {
                path: fullPath,
                contentBase64: b64
            };
        }));

        const { data, error } = await supabase.functions.invoke('github-manager', {
            body: {
                action: 'bulk_save',
                files: preparedFiles,
                branch: branch
            }
        });

        if (error || !data?.success) {
            throw new Error(error?.message || data?.error || 'Bulk upload failed');
        }

        // Map results back to usable URLs and relative paths
        const resultFiles = preparedFiles.map(f => {
            const relativePath = f.path.startsWith('/') ? f.path : `/${f.path}`;
            return {
                path: relativePath,
                url: `https://raw.githubusercontent.com/agutyauno/a9sr-data/main${relativePath}`
            };
        });

        return {
            success: true,
            commitUrl: data.commitUrl,
            files: resultFiles
        };
    } catch (err) {
        console.error('Error in uploadFilesToGithub:', err);
        return {
            success: false,
            error: err.message || 'Error connecting to upload service'
        };
    }
};

