import { supabase } from './supabaseClient';
import { fileToBase64 } from '../utils/fileUtils';

/**
 * Maps asset type and category to the correct GitHub folder path.
 * @param {string} type - 'image', 'audio', 'video'
 * @param {string} category - 'background', 'thumbnail', 'bgm', 'sfx', 'PV', 'char_avatar', 'character', 'story_image'
 * @returns {string}
 */
export const getFolderPath = (type, category) => {
    if (type === 'image') {
        if (category === 'background') return 'images/backgrounds';
        if (category === 'thumbnail') return 'images/thumbnails';
        if (category === 'char_avatar') return 'images/char_avatars';
        if (category === 'character') return 'images/characters';
        if (category === 'gallery') return 'images/story_images';
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
            return {
                success: false,
                error: (error?.message || data?.error || 'GitHub upload failed')
            };
        }

        // The URL format based on JsDelivr or GitHub raw
        const rawUrl = `https://raw.githubusercontent.com/agutyauno/a9sr-data/main/${data.path}`;

        return {
            success: true,
            path: data.path,
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
    let fullPath = url;
    if (url.includes('/main/')) {
        fullPath = url.split('/main/')[1];
    } else if (url.includes('githubusercontent.com')) {
        const parts = url.split('/');
        const mainIndex = parts.indexOf('main');
        if (mainIndex !== -1) {
            fullPath = parts.slice(mainIndex + 1).join('/');
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
