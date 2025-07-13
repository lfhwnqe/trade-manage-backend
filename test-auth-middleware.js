#!/usr/bin/env node

/**
 * 简单的认证中间件测试脚本
 * 用于验证白名单路由和认证功能是否正常工作
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用例
const testCases = [
  {
    name: '测试根路径 (应该可以访问)',
    url: `${BASE_URL}/`,
    shouldPass: true,
    needsAuth: false
  },
  {
    name: '测试健康检查 (应该可以访问)',
    url: `${BASE_URL}/health`,
    shouldPass: true,
    needsAuth: false
  },
  {
    name: '测试登录路由 (应该可以访问)',
    url: `${BASE_URL}/auth/login`,
    method: 'POST',
    data: { username: 'test', password: 'test' },
    shouldPass: true,
    needsAuth: false
  },
  {
    name: '测试注册路由 (应该可以访问)',
    url: `${BASE_URL}/auth/register`,
    method: 'POST',
    data: { username: 'test', email: 'test@test.com', password: 'test' },
    shouldPass: true,
    needsAuth: false
  },
  {
    name: '测试用户资料路由 (需要认证)',
    url: `${BASE_URL}/auth/profile`,
    shouldPass: false,
    needsAuth: true
  },
  {
    name: '测试用户列表路由 (需要认证)',
    url: `${BASE_URL}/users`,
    shouldPass: false,
    needsAuth: true
  },
  {
    name: '测试交易列表路由 (需要认证)',
    url: `${BASE_URL}/trades`,
    shouldPass: false,
    needsAuth: true
  }
];

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 5000,
      headers: {}
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTest(testCase) {
  try {
    const response = await makeRequest(
      testCase.url,
      testCase.method || 'GET',
      testCase.data
    );
    
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   状态码: ${response.status}`);
    
    if (testCase.needsAuth && response.status === 401) {
      console.log(`   ✅ 正确 - 需要认证的路由返回 401`);
      return true;
    } else if (!testCase.needsAuth && (response.status === 200 || response.status === 201 || response.status === 400)) {
      console.log(`   ✅ 正确 - 白名单路由可以访问`);
      return true;
    } else {
      console.log(`   ❌ 错误 - 预期状态与实际不符`);
      console.log(`   预期: ${testCase.needsAuth ? '401 (需要认证)' : '200/201/400 (可访问)'}`);
      return false;
    }
  } catch (error) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 开始测试认证中间件和白名单配置...\n');
  console.log('⚠️  请确保应用正在运行在 http://localhost:3000');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    if (passed) passedTests++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！认证中间件和白名单配置正常工作。');
  } else {
    console.log('⚠️  部分测试失败，请检查配置。');
  }
}

// 运行测试
runAllTests().catch(console.error);
