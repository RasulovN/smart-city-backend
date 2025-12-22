const express = require('express'); 
const router = express.Router();
const AdditionalController = require('../../controller/ai/additonal.controller');

// Create instance of the controller
const additionalController = new AdditionalController();

// Example route for AI data getter
router.get('/ai-chat/getter-all', additionalController.getterAll);

const AiChatController = require('../../controller/ai/chat.controller');
const aiChatController = new AiChatController();

router.post('/chat', aiChatController.chat);





// additional 
// Har bir model uchun alohida endpoint
router.get('/appeals', additionalController.getAppeals);
router.get('/companies', additionalController.getCompanies);
router.get('/sectors', additionalController.getSectors);
router.get('/notifications', additionalController.getNotifications);
router.get('/attendance', additionalController.getAttendance);
router.get('/stats', additionalController.getStats);


module.exports = router;
