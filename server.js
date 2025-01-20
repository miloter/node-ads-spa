import express from 'express';
import cookieParser from 'cookie-parser';
// import cors from 'cors';
import { viewsDir, publicDir, maxRequestSize } from './helpers/utils.js';
import indexRouter from './routers/index.js';
import authRouter from './routers/auth.js';
import adsRouter from './routers/ads.js';

const app = express();

// Confiamos en el proxy (si lo hubiere), es necesario para
// saber si estamos detrás de un proxy con HTTPS
app.enable('trust proxy');

// Habilitamos una carpeta para recursos estáticos
app.use(express.static(publicDir));

// Para parsear las cabeceras Cookie
app.use(cookieParser());

// Para parsear datos del body de solicitudes application/json
app.use(express.json({ extended: false, limit: maxRequestSize }));

// Middleware para evitar CORS en desarrollo
app.use((req, res, next) => {
    const corsWhiteList = [
        'http://localhost:5173'
    ];
    if (corsWhiteList.indexOf(req.headers.origin) >= 0) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    }
    next();
});

// Middlewares de enrutamiento
app.use(indexRouter);
app.use(authRouter);
app.use(adsRouter);

// Middleware centralizado de página no encontrada (404)
app.use((req, res, next) => {
    res.status(404).json({ error: `Página no encontrada: ${req.path}` });
});

// Middleware centralizado de error (debe ser el último) y solo funciona
// bien si tiene 4 parámetros en este orden: (err, req, res, next) => ...
app.use((err, req, res, next) => {    
    res.status(500).json({ error: err.message });
});

export { app };
