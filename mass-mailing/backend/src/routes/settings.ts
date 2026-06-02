import { Router } from 'express';
import { getMailSettings, updateMailSettings } from '../controllers/settingsController';

const router = Router();

router.get('/mail', getMailSettings);
router.put('/mail', updateMailSettings);

export default router;
