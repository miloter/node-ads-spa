import express from 'express';
import { getAuthenticatedUser, requireAuthorization, requireNoAuthorization } from '../helpers/utils.js';
import {    
    apiAuthUserGet,
    apiAuthLoginPost,
    apiAuthLogoutGet,
    apiAuthSignUpPost
} from '../controllers/auth.js';

const authRouter = express.Router();

authRouter.get('/api/auth/user', getAuthenticatedUser, apiAuthUserGet);
authRouter.post('/api/auth/login', apiAuthLoginPost);
authRouter.post('/api/auth/signup', apiAuthSignUpPost);
authRouter.get('/auth/login', requireNoAuthorization);
authRouter.get('/api/auth/logout', requireAuthorization, apiAuthLogoutGet);

export default authRouter;
