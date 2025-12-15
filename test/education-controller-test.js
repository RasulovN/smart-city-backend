// Test file for education controller
const educationController = require('../controller/sectors/education.controller');

console.log('Education Controller Methods:');
console.log('1. getEducationStats - ', typeof educationController.getEducationStats);
console.log('2. getSchoolsData - ', typeof educationController.getSchoolsData);  
console.log('3. getSchoolFaceIdData - ', typeof educationController.getSchoolFaceIdData);

console.log('\nStatic Helper Methods:');
console.log('4. getDateFilter - ', typeof educationController.constructor.getDateFilter);
console.log('5. aggregateStats - ', typeof educationController.constructor.aggregateStats);
console.log('6. processSchoolsData - ', typeof educationController.constructor.processSchoolsData);
console.log('7. processFaceIdData - ', typeof educationController.constructor.processFaceIdData);

// Test date filter functionality
console.log('\nDate Filter Tests:');
const weekly = educationController.constructor.getDateFilter('weekly');
const monthly = educationController.constructor.getDateFilter('monthly'); 
const yearly = educationController.constructor.getDateFilter('yearly');

console.log('Weekly filter:', weekly);
console.log('Monthly filter:', monthly);
console.log('Yearly filter:', yearly);

console.log('\nController is ready to use!');