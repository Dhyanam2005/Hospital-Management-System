const request = require('supertest');
const app = require('../app');

// Mock the database module
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

const db = require('../config/db');

describe('GET /', () => {
  it('should return backend running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Backend is running!');
  });
});

describe('GET /doctor', () => {
  it('should return doctor data or empty array', async () => {
    const mockDoctors = [
      {
        doc_id: 1,
        doc_type: 'Full Time',
        name: 'Dr. A',
        email: 'a@example.com',
        phone: '1234567890',
        address: 'City',
        qualification: 'MBBS',
        medical_license_number: 'ABC123',
        created_at: '2023-01-01',
        specialization: 'Cardiology',
        user_name: 'dr_a',
      },
    ];

    db.query.mockImplementation((sql, callback) => {
      callback(null, mockDoctors);
    });

    const res = await request(app).get('/doctor');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockDoctors);
  });
});
