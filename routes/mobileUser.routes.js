const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const mobileUserController = require('../controller/mobileUser.controller');



// User registration (public)
router.post('/register', mobileUserController.registerUser);

// User login (public)
router.post('/login', mobileUserController.login);


// logout user (protected)
router.post('/logout', 
    verifyToken,
    mobileUserController.logOut
);



module.exports = router;