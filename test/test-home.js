'use strict';

/*
 * Module dependencies.
 */

const test = require('tape');
const request = require('supertest');
const { app } = require('../server');

test('Home page', t => {
  request(app)
    .get('/')
    .expect(200)
    .end(t.end);
});

test.onFinish(() => process.exit(0));
