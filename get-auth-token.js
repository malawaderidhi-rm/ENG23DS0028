const http = require('http');
const data = JSON.stringify({
  email: 'eng23ds0028@dsu.edu.in',
  name: 'ridhi malawade',
  rollNo: 'eng23ds0028',
  accessCode: 'BgWZSW',
  clientID: 'd893f1a1-ba2c-4920-93d5-32a869d4ed57',
  clientSecret: 'kYxMQGYXzuhaqqaq',
});

const options = {
  hostname: '4.224.186.213',
  port: 80,
  path: '/evaluation-service/auth',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(body);
  });
});

req.on('error', (e) => console.error('ERROR', e.message));
req.write(data);
req.end();
