#!/usr/bin/env node

/**
 * 邮箱验证接口测试脚本
 * 
 * 使用方法:
 * 1. 确保应用正在运行: npm run start:dev
 * 2. 运行测试: node test-email-verification.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

function log(message, color = 'cyan') {
  console.log(colors[color](`[${new Date().toISOString()}] ${message}`));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 测试函数
async function testUserRegistration() {
  logInfo('Testing user registration...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.status === 201) {
      logSuccess('User registration successful');
      logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.data.data.requiresVerification) {
        logInfo('User requires email verification as expected');
        return true;
      } else {
        logWarning('User does not require verification - this might be unexpected');
        return false;
      }
    }
  } catch (error) {
    logError(`Registration failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testEmailVerificationWithInvalidCode() {
  logInfo('Testing email verification with invalid code...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-registration`, {
      username: testUser.username,
      verificationCode: '000000' // Invalid code
    });
    
    logError('Expected verification to fail with invalid code, but it succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Email verification correctly failed with invalid code');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function testEmailVerificationWithNonExistentUser() {
  logInfo('Testing email verification with non-existent user...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-registration`, {
      username: 'nonexistent_user',
      verificationCode: '123456'
    });
    
    logError('Expected verification to fail with non-existent user, but it succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Email verification correctly failed with non-existent user');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function testEmailVerificationWithExpiredCode() {
  logInfo('Testing email verification with expired code...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-registration`, {
      username: testUser.username,
      verificationCode: '999999' // This should trigger expired code error in some cases
    });
    
    logWarning('Verification did not fail as expected - code might not be expired');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && 
        (error.response.data.message.includes('expired') || 
         error.response.data.message.includes('Invalid'))) {
      logSuccess('Email verification correctly handled expired/invalid code');
      logInfo(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function testInputValidation() {
  logInfo('Testing input validation...');
  
  const testCases = [
    {
      name: 'Empty username',
      data: { username: '', verificationCode: '123456' },
      expectedStatus: 400
    },
    {
      name: 'Empty verification code',
      data: { username: testUser.username, verificationCode: '' },
      expectedStatus: 400
    },
    {
      name: 'Invalid verification code format (too short)',
      data: { username: testUser.username, verificationCode: '123' },
      expectedStatus: 400
    },
    {
      name: 'Invalid verification code format (too long)',
      data: { username: testUser.username, verificationCode: '1234567' },
      expectedStatus: 400
    },
    {
      name: 'Invalid verification code format (contains letters)',
      data: { username: testUser.username, verificationCode: '12345a' },
      expectedStatus: 400
    }
  ];

  let passedTests = 0;
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-registration`, testCase.data);
      logError(`${testCase.name}: Expected validation error but request succeeded`);
    } catch (error) {
      if (error.response?.status === testCase.expectedStatus) {
        logSuccess(`${testCase.name}: Validation correctly failed`);
        passedTests++;
      } else {
        logError(`${testCase.name}: Unexpected status ${error.response?.status}, expected ${testCase.expectedStatus}`);
      }
    }
  }
  
  return passedTests === testCases.length;
}

async function testHealthCheck() {
  logInfo('Testing health check endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      logSuccess('Health check passed');
      return true;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('🚀 Starting Email Verification API Tests', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const results = [];
  
  // 健康检查
  results.push(await testHealthCheck());
  
  // 用户注册测试
  results.push(await testUserRegistration());
  
  // 输入验证测试
  results.push(await testInputValidation());
  
  // 邮箱验证错误场景测试
  results.push(await testEmailVerificationWithInvalidCode());
  results.push(await testEmailVerificationWithNonExistentUser());
  results.push(await testEmailVerificationWithExpiredCode());
  
  // 测试结果汇总
  log('=' .repeat(50), 'cyan');
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  if (passedTests === totalTests) {
    logSuccess(`All tests passed! (${passedTests}/${totalTests})`);
  } else {
    logWarning(`Some tests failed. Passed: ${passedTests}/${totalTests}`);
  }
  
  log('📝 Test Notes:', 'yellow');
  log('- To test successful verification, you need a real verification code from Cognito', 'yellow');
  log('- Check your email for the verification code after registration', 'yellow');
  log('- Manual testing with real codes is recommended for complete validation', 'yellow');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  logError(`Test execution failed: ${error.message}`);
  process.exit(1);
});
