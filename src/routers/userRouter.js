const express = require("express");
const userCon = require('../controllers/userController.js');
const auth = require('../middleware/authMiddleware.js');


const router = express.Router();
 
router.post('/registration', userCon.reqistration);
router.post('/login', userCon.login); 
router.get('/', auth, userCon.get_users);
router.patch('/', auth, userCon.change_boss);

module.exports = router;