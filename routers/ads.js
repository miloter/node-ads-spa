import express from 'express';
import {    
    apiAdsCreatePost,
    apiAdsGet,
    apiAdsIdDelete,
    apiAdsIdPut,
} from '../controllers/ads.js';
import { requireAuthorization } from '../helpers/utils.js';

const adsRouter = express.Router();

adsRouter.get('/api/ads', requireAuthorization, apiAdsGet);
adsRouter.delete('/api/ads/:id', requireAuthorization, apiAdsIdDelete);
adsRouter.put('/api/ads', requireAuthorization, apiAdsIdPut);
adsRouter.post('/api/ads/create', requireAuthorization, apiAdsCreatePost);

export default adsRouter;
