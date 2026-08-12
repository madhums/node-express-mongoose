'use strict';

/*
 * Module dependencies.
 */

const test = require('tape');
const request = require('supertest');
const { app, connection } = require('../server');

test('Home page', t => {
  request(app)
    .get('/')
    .expect(200)
    .end(t.end);
});

// test.onFinish(async () => {
//   await connection.close();
// });
// test.onFinish(() => process.exit(0));

test.onFinish(async () => {
  connection.removeAllListeners('disconnected');
  await connection.close();
});
