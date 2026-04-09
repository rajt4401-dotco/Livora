const request = require('supertest');
const app = require('../server');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const mock = new MockAdapter(axios);

describe('AI Integration Tests', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('POST /api/ai/analyze-complaint', () => {
    it('should return AI analysis if Python service is up', async () => {
      mock.onPost('http://localhost:8000/analyze').reply(200, {
        success: true,
        category: 'Plumbing',
        priority: 'High',
        confidence: 0.95,
        sentiment: 'negative'
      });

      const res = await request(app)
        .post('/api/ai/analyze-complaint')
        .send({ text: 'The pipe is leaking in my bathroom' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.category).toBe('Plumbing');
      expect(res.body.result.source).toBe('ai');
    });

    it('should fallback to keyword classifier if Python service is down', async () => {
      mock.onPost('http://localhost:8000/analyze').networkError();

      const res = await request(app)
        .post('/api/ai/analyze-complaint')
        .send({ text: 'The wifi is slow' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.result.category).toBe('Network');
      expect(res.body.result.source).toBe('fallback');
    });
  });

  describe('POST /api/ai/sentiment', () => {
    it('should return sentiment analysis', async () => {
      mock.onPost('http://localhost:8000/sentiment').reply(200, {
        success: true,
        sentiment: 'positive',
        confidence: 0.88
      });

      const res = await request(app)
        .post('/api/ai/sentiment')
        .send({ text: 'Staff is very helpful' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.result.sentiment).toBe('positive');
    });
  });

  describe('POST /api/ai/predict-fee', () => {
    it('should return fee delinquency prediction', async () => {
      mock.onPost('http://localhost:8000/predict-fee').reply(200, {
        success: true,
        riskLevel: 'Low',
        probability: 0.15
      });

      const res = await request(app)
        .post('/api/ai/predict-fee')
        // Mock student data
        .send({ unpaid_semesters: 0, year: 2024 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.result.riskLevel).toBe('Low');
    });
  });
});
