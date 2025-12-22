const Appeal = require('../../models/appeals'); // to'g'ri yo'lni o'zgartiring
const Company = require('../../models/company');
const Sector = require('../../models/sector');
const Notification = require('../../models/notification');
const OptimizedAttendance = require('../../models/OptimizedAttendance');
const Stats = require('../../models/Stats');
const { spawn } = require('child_process');
const AdditionalController = require('./additonal.controller');

class AiChatController {
//   chat funksiyasi
async chat (req, res) {
    try {
        const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const answer = await askLLM(message);
    console.log(answer);
    
    res.json({ answer });
    } catch (error) {
        console.error("Chat error:", error);
    }
}
 
}

module.exports  = AiChatController;