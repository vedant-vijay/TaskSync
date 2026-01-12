const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/project/:projectId', taskController.getProjectTasks);
router.get('/:id', taskController.getTaskById);
router.patch('/:id/status', taskController.updateTaskStatus);
router.patch('/:id/assign', taskController.assignTask);

module.exports = router;