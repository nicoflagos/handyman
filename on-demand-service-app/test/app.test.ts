import request from 'supertest';
import app from '../src/app';

describe('App Tests', () => {
    it('should respond with a 200 status for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    it('should respond with a 404 status for non-existent endpoints', async () => {
        const response = await request(app).get('/non-existent');
        expect(response.status).toBe(404);
    });
});