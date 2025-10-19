
/**
 * @fileoverview Unit tests for example-subroute/example.js route
 * @author KU Connect Team
 */

const request = require('supertest')
const express = require('express')
const exampleSubrouteRouter = require('../../../../src/routes/example-subroute/example')

describe('example-subroute/example.js route', () => {
	let app
	beforeAll(() => {
		app = express()
		app.use(express.json())
		app.use('/', exampleSubrouteRouter)
	})

	it('GET / should return subroute message', async () => {
		const res = await request(app).get('/')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ message: 'This is an example subroute!' })
	})

	it('GET /yes should return subsubroute message', async () => {
		const res = await request(app).get('/yes')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ message: 'This is an example subsubroute!' })
	})
})
