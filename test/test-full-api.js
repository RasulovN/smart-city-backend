// Test the full API functionality
const educationController = require('../controller/sectors/education.controller');

// Mock request and response objects
const mockReq = {
    query: {
        period: 'full',
        limit: 1000
    }
};

const mockRes = {
    json: function(data) {
        console.log('API Response:', JSON.stringify(data, null, 2));
        return data;
    },
    status: function(code) {
        console.log('Status:', code);
        return this;
    }
};

async function testFullAPI() {
    console.log('🧪 Testing Full API...');
    
    try {
        console.log('\n1. Testing getSchoolsData with full period...');
        await educationController.getSchoolsData(mockReq, mockRes);
        
        console.log('\n2. Testing date filters...');
        
        // Test different periods
        const periods = ['weekly', 'monthly', 'yearly', 'full'];
        
        for (const period of periods) {
            const filter = educationController.constructor.getDateFilter(period);
            console.log(`${period}:`, JSON.stringify(filter));
        }
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testFullAPI();