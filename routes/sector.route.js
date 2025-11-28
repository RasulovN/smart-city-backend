const express = require('express');
const router = express.Router();


router.use("/appeals", require("./sectors/appeals.route"));
router.use("/tasks", require("./sectors/appeals.route"));

 
module.exports = router;
