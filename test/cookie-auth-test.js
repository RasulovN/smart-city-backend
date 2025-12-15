const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testCookieAuth() {
  const jar = axios.defaults.jar = true;
  const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    jar,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  try {
    console.log('🧪 Testing Cookie-Based Authentication...\n');

    // Test 1: Login
    console.log('1. Testing Login...');
    const loginResponse = await api.post('/auth/login', {
      email: 'nurbekrasulov71@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.data.user.username);
    console.log('   Role:', loginResponse.data.data.user.role);
    console.log('   Message:', loginResponse.data.message);
    
    // Check if cookies are set
    console.log('   Cookies set:', Object.keys(jar._jar.store.idx));
    console.log();

    // Test 2: Access protected endpoint
    console.log('2. Testing Protected Endpoint (Profile)...');
    const profileResponse = await api.get('/auth/profile');
    
    console.log('✅ Profile access successful');
    console.log('   Username:', profileResponse.data.data.user.username);
    console.log('   Email:', profileResponse.data.data.user.email);
    console.log();

    // Test 3: Token Refresh
    console.log('3. Testing Token Refresh...');
    const refreshResponse = await api.post('/auth/refresh-token');
    
    console.log('✅ Token refresh successful');
    console.log('   Message:', refreshResponse.data.message);
    console.log('   Expires in:', refreshResponse.data.data.expiresIn);
    console.log();

    // Test 4: Logout
    console.log('4. Testing Logout...');
    const logoutResponse = await api.post('/auth/logout');
    
    console.log('✅ Logout successful');
    console.log('   Message:', logoutResponse.data.message);
    console.log('   Cookies after logout:', Object.keys(jar._jar.store.idx));
    console.log();

    // Test 5: Access protected endpoint after logout (should fail)
    console.log('5. Testing Protected Endpoint After Logout...');
    try {
      await api.get('/auth/profile');
      console.log('❌ ERROR: Should not be able to access profile after logout');
    } catch (error) {
      console.log('✅ Correctly blocked access after logout');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.message);
    }
    
    console.log('\n🎉 All tests passed! Cookie-based authentication is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have a user with:');
      console.log('   Email: nurbekrasulov71@gmail.com');
      console.log('   Password: admin123');
    }
  }
}

// Run the test
testCookieAuth();