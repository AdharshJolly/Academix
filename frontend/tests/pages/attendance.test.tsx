import React from 'react';
import { render, screen } from '@testing-library/react';
import AttendancePage from '../../app/attendance/page';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User' },
    token: 'fake-token',
    loading: false,
  }),
}));

jest.mock('../../services/attendance.service', () => ({
  AttendanceService: {
    getRecords: jest.fn().mockResolvedValue({
      success: true,
      data: []
    }),
  }
}));

describe('Attendance Page', () => {
  it('renders without crashing and loads data', async () => {
    render(<AttendancePage />);
    expect(await screen.findByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
  });
});
