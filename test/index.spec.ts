import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function seedUsers() {
	await env.p6.batch([
		env.p6.prepare('DROP TABLE IF EXISTS users'),
		env.p6.prepare(`
			CREATE TABLE users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL
			)
		`),
		env.p6.prepare('INSERT INTO users (name) VALUES (?), (?)').bind('Ada Lovelace', 'Grace Hopper'),
	]);
}

describe('Hello World worker', () => {
	beforeEach(async () => {
		await seedUsers();
	});

	it('returns JSON with message and database rows (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');

		const body = await response.json();
		expect(body).toEqual({
			message: 'Hello World 3!',
			dbData: [
				{ id: 1, name: 'Ada Lovelace' },
				{ id: 2, name: 'Grace Hopper' },
			],
		});
	});

	it('returns JSON with message and database rows (integration style)', async () => {
		const response = await exports.default.fetch(new IncomingRequest('https://example.com'));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			message: 'Hello World 3!',
			dbData: [
				{ id: 1, name: 'Ada Lovelace' },
				{ id: 2, name: 'Grace Hopper' },
			],
		});
	});

	it('queryDatabase returns all users from D1', async () => {
		const results = await worker.queryDatabase(env.p6);
		expect(results).toEqual([
			{ id: 1, name: 'Ada Lovelace' },
			{ id: 2, name: 'Grace Hopper' },
		]);
	});

	it('queryDatabase returns an empty list when the table has no rows', async () => {
		await env.p6.prepare('DELETE FROM users').run();
		const results = await worker.queryDatabase(env.p6);
		expect(results).toEqual([]);
	});
});
