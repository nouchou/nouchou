const express = require('express');
const { protect, authorize } = require('../middleware/auth');

// ── Auth ──────────────────────────────────────────────────────
const authRouter = express.Router();
const { login, refresh, me, logout } = require('../controllers/authController');
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.get('/me', protect, me);
authRouter.post('/logout', protect, logout);

// ── Users ─────────────────────────────────────────────────────
const userRouter = express.Router();
const uc = require('../controllers/userController');
userRouter.use(protect, authorize('admin'));
userRouter.get('/', uc.getAll);
userRouter.get('/:id', uc.getOne);
userRouter.post('/', uc.create);
userRouter.put('/:id', uc.update);
userRouter.delete('/:id', uc.remove);

// ── CycloPousse ───────────────────────────────────────────────
const cpRouter = express.Router();
const cc = require('../controllers/cycloPousseController');
cpRouter.use(protect);
cpRouter.get('/stats', cc.getStats);
cpRouter.get('/', cc.getAll);
cpRouter.get('/:id', cc.getOne);
cpRouter.post('/', authorize('admin', 'gestionnaire'), cc.create);
cpRouter.put('/:id', authorize('admin', 'gestionnaire'), cc.update);
cpRouter.delete('/:id', authorize('admin'), cc.remove);
cpRouter.get('/:id/qrcode', cc.getQRCode);
cpRouter.post('/:id/cotisations', authorize('admin', 'gestionnaire'), cc.addCotisation);
cpRouter.put('/:id/cotisations/:cid', authorize('admin', 'gestionnaire'), cc.updateCotisation);
cpRouter.delete('/:id/cotisations/:cid', authorize('admin'), cc.deleteCotisation);

// ── Activités (journal admin) ─────────────────────────────────
const activiteRouter = express.Router();
const ac = require('../controllers/activiteController');
activiteRouter.use(protect, authorize('admin'));
activiteRouter.get('/', ac.getAll);
activiteRouter.get('/resume', ac.getResume);

module.exports = { authRouter, userRouter, cpRouter, activiteRouter };
