import { db } from "../helpers/db.js";
import TextValidator from "@miloter/text-validator";

// Devuelve un JSON con los anuncios: GET /api/ads
const apiAdsGet = async (req, res, next) => {    
    try {        
        const [rows] = await db.execute(`select a.id, user_id, username,
            avatar, text, contact, last_modified
            from ads a inner join users u on a.user_id = u.id;
        `);        
        
        return res.status(200).json({            
            success: 'Registros obtenidos',
            user: req.user,
            rows
        });           
    } catch (error) {
        return next(error);        
    }
};

// Procesa una petición para eliminar un anuncio: DELETE /api/ads/:id
const apiAdsIdDelete = async (req, res, next) => {
    try {
        const id = req.params.id;

        // Elimina el anuncio
        const [result] = await db.execute(
            'delete from ads where id = ?', [id]);
        if (result.affectedRows === 1) {
            return res.status(200).json({
                success: 'Anuncio eliminado con éxito'
            });
        } else {
            return res.status(400).json({
                error: `Identificador de anuncio inválido: ${id}`
            });
        }
    } catch (error) {
        return next(error);
    }
};

// Procesa una petición para actualizar un anuncio: PUT /api/ads
const apiAdsIdPut = async (req, res, next) => {    
    try {
        const { id, text, contact } = req.body;
        const tv = new TextValidator();

        if (!(
            tv.validate(text, TextValidator.reAnyWordChar,
                'El texto debe contener al menos un carácter alfanumérico',
                { maxLength: 255 }) &&
            tv.validate(contact, TextValidator.reStr,
                'Los datos de contacto no son válidos',
                { maxLength: 64 })
            )) {
            return res.status(400).json({
                error: tv.getLastMessage()
            });
        }
        
        // Actualizamos el anuncio
        const [result] = await db.execute(
            'update ads set text = ?, contact = ? where id = ?', [text, contact, id]);
        if (result.changedRows === 1) {
            return res.status(200).json({                
                success: 'Anuncio actualizado con éxito',
            });
        } else if (result.affectedRows === 1) {
            return res.status(400).json({
                error: 'El anuncio no ha cambiado',
            });
        } else {
            return res.status(400).json({
                error: `Identificador de anuncio inválido: ${id}`
            });
        }
    } catch (error) {
        return next(error);
    }
};

export {    
    apiAdsGet,
    apiAdsIdDelete,
    apiAdsIdPut
};
