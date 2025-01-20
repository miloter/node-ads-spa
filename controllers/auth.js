import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcrypt';
import {
    jwtCookieName,
    generateJwt,
    setJwtCookie,
    uploadDir,
    maxUploadFileSize
} from "../helpers/utils.js";
import { db } from '../helpers/db.js';
import TextValidator from '@miloter/text-validator';

// Datos de la página de registro
const registerPage = {
    title: 'Registrarse',
    description: 'Permite registrarse con un email, username y password',
    keywords: 'email, username, password'
};

// Devuelve información del usuario que hace la petición a parti del JWT
// válido, o un valor de usuario null: /api/auth/user
const apiAuthUserGet = (req, res, next) => {
    res.status(200).json({ success: 'OK', user: req.user });
};

// Permite el inicio de sesión en la aplicación, si el inicio es
// correcto, se devuelve un JSON Web Token
const apiAuthLoginPost = async (req, res, next) => {
    try {
        const msgUnathorized = 'Usuario o contraseña incorrectos';
        const { username, password } = req.body;
        const [user] = await db.execute('select * from users where username = ?', [username]);

        if (user.length) {
            const match = await bcrypt.compare(password, user[0].password);

            if (match) {
                const { id, username, is_admin, avatar } = user[0];
                const accessToken = await generateJwt({
                    id,
                    username,
                    is_admin,
                    avatar
                });
                setJwtCookie(res, accessToken, req.secure);
                return res.status(200).json({
                    user: { id, username, is_admin, avatar },
                    success: 'Usuario autenticado con éxito'
                });
            } else {
                return res.status(401).json({ error: msgUnathorized });
            }
        } else {
            return res.status(401).json({ error: msgUnathorized });
        }
    } catch (error) {
        next(error);
    }
};

// Permite el registro en la aplicación, si el registro es
// correcto, se devuelve una cookie con un JSON Web Token
const apiAuthSignUpPost = async (req, res, next) => {
    try {
        const { files, email, username, password } = req.body;
        const file = files[0]; // Solo el primer fichero 
        const tv = new TextValidator();

        if (file && !(
            tv.validateFileSize(file.size, maxUploadFileSize)) &&
            tv.validateFilename(file.name, { reExt: TextValidator.reImgExt })
        ) {
            return res.status(400).json({ error: tv.getLastMessage() });
        }


        if (!(
            tv.validateMail(email) &&
            tv.validateUsername(username) &&
            tv.validatePassword(password)
        )) {
            return res.status(400).json({ error: tv.getLastMessage() });
        }

        // Comprueba que no exista el usuario o el email
        let [result] = await db.execute(
            'select * from users where username = ? or email = ?',
            [username, email]);
        if (result.length) {
            return res.status(400).json({ error: 'Utilice otro nombre de usuario, o e-mail' });
        }

        // Obtenemos el hash del password
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        [result] = await db.execute(
            'insert into users(username, password, email, avatar) values(?, ?, ?, ?)',
            [username, passwordHash, email, file ? file.name : null]);

        if (file) {
            // Guardamos el fichero en disco            
            await writeFile(
                path.join(uploadDir, file.name),
                file.content.substring(file.content.indexOf(',') + 1),
                { encoding: 'base64' }
            );
        }

        // Genera la cookie de sesión y la envía al cliente
        const user = {
            id: result.insertId,
            username,
            is_admin: 0,
            avatar: file ? file.name : null
        };
        const accessToken = await generateJwt(user);
        setJwtCookie(res, accessToken, req.secure);
        return res.status(201).json({
            user,
            success: 'Registro realizado con éxito'
        });
    } catch (error) {
        return next(error);
    }
};

// Cierra la sesión
const apiAuthLogoutGet = (req, res, next) => {
    res.cookie(jwtCookieName, '', { maxAge: -1 });
    return res.status(200).json({ success: 'Cierre de sesión correcto ' });
};

export {
    apiAuthUserGet,
    apiAuthLoginPost,
    apiAuthLogoutGet,
    apiAuthSignUpPost,
};
