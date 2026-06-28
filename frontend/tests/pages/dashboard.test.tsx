import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../../app/dashboard/page';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User' },
    token: 'fake-token',
    loading: false,
  }),
}));

// Mock the DashboardContext
jest.mock('../../contexts/DashboardContext', () => ({
  useDashboard: () => ({
    data: {
      crunch_windows: [],
      academic_health: { risk_level: 'Low', risk_score: 0.1, summary: 'Good' },
      today_schedule: [],
      upcoming_deadlines: [],
    },
    isLoading: false,
    error: null,
  }),
}));

describe('Dashboard Page', () => {
  it('renders without crashing and loads data', async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/Overview/i)).toBeInTheDocument();
  });
});
