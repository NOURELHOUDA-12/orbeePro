const express = require('express');
const router = express.Router();
const auth=require('../middlewares/authmidelware');

const taskController = require('../controllers/TasckController');

 //router.get('/',auth, taskController.getAllTasks);




 router.get('/getAll',auth, taskController.getAllTasks);

router.get('/manager-data',auth, taskController.getTaskManagerData);

  
router.post('/', taskController.createTask);

router.put('/:id/status', taskController.updateStatus);

router.put('/:id', taskController.updateTask);

router.delete('/:id', taskController.deleteTask);

router.put('/pause/:id', taskController.pauseTask);
router.put('/resume/:id', taskController.resumeTask);
router.get('/history/:id', taskController.getTaskHistory);
router.get('/employee/:staffId', taskController.getEmployeeTasks);

// pour les pauses
// GET 
router.get('/:id/pauses', taskController.getPauses);
router.post('/:id/pauses', taskController.startPause);
router.patch('/:id/pauses/end', taskController.endPause);

// POST /tasks/:id/pauses

module.exports = router;
    
 