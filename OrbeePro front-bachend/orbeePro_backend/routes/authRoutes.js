const express=require('express')
const router=express.Router()
const authCtrl=require('../controllers/authController')
const upload=require('../middlewares/uploads')

router.post('/register',upload.single('profileImage'),authCtrl.register);
router.post('/login',authCtrl.login);



module.exports=router;


