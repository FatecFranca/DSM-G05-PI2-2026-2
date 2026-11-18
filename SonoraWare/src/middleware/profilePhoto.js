import multer from 'multer';
import { MAX_PHOTO_SIZE } from '../models/profilePhoto.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_SIZE, files: 1, fields: 50, fieldSize: 64 * 1024 },
}).single('foto_perfil');

// JSON requests remain supported when no image is being uploaded.
export function profilePhoto(req, res, next) {
    upload(req, res, error => {
        if (error) {
            const tooLarge = error.code === 'LIMIT_FILE_SIZE';
            return res.status(tooLarge ? 413 : 400).json({
                error: tooLarge ? 'foto_perfil must not exceed 5 MiB' : 'Invalid upload; send one file named foto_perfil',
            });
        }
        if (req.is('multipart/form-data')) {
            const body = req.body ?? {};
            for (const field of ['numero_artistas', 'ano_formacao', 'capacidade']) {
                if (typeof body[field] === 'string' && body[field].trim() !== '') body[field] = Number(body[field]);
            }
            if (body.possui_instrumentos === 'true') body.possui_instrumentos = true;
            if (body.possui_instrumentos === 'false') body.possui_instrumentos = false;
            for (const field of ['estruturas', 'acessibilidades', 'tipos_evento', 'estilos_musicais', 'instrumentos']) {
                if (typeof body[field] === 'string') {
                    try { body[field] = JSON.parse(body[field]); }
                    catch { return res.status(400).json({ error: `${field} must be a JSON array of integer IDs` }); }
                }
            }
            if (body.foto_perfil === 'null') body.foto_perfil = null;
            if (req.file) body.foto_perfil = req.file.buffer;
            req.body = body;
        }
        next();
    });
}
