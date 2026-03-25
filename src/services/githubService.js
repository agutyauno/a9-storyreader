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
export const uploadFileToGithub = async (file, folderPath) => {
    try {
        const contentBase64 = await fileToBase64(file);
        
        const { data, error } = await supabase.functions.invoke('github-manager', {
            body: {
                action: 'save',
                folderPath: folderPath,
                fileName: file.name,
                contentBase64: contentBase64,
                branch: 'main'
            }
        });

        // If specifically an auth or network error, we might want to fall back to local test mode
        if (error || !data?.success) {
            console.warn('GitHub upload failed, falling back to local blob URL for testing:', error || data?.error);
            return {
                success: true,
                path: `local/${file.name}`,
                url: URL.createObjectURL(file), // Local preview URL
                isLocal: true
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
        // Fallback for any error to allow local testing
        return {
            success: true,
            path: `local/${file.name}`,
            url: URL.createObjectURL(file),
            isLocal: true
        };
    }
};
