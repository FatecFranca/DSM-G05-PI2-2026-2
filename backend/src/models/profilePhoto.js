export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// Inspect the bytes rather than trusting the filename or browser MIME type.
export function photoMimeType(bytes) {
    if (!Buffer.isBuffer(bytes)) return null;
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
    if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return 'image/jpeg';
    if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
    if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return null;
}

export function serializePhoto(account) {
    if (Buffer.isBuffer(account.foto_perfil)) {
        const mime = photoMimeType(account.foto_perfil);
        return { ...account, foto_perfil: mime ? `data:${mime};base64,${account.foto_perfil.toString('base64')}` : null };
    }
    return account;
}
