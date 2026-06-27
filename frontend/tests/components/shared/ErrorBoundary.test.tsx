import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Suppress console.error during tests so it doesn't clutter the test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children if no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders error fallback if error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('System Error')).toBeInTheDocument();
    expect(screen.getByText(/unexpected anomaly/i)).toBeInTheDocument();
  });

  it('allows user to retry and clear error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Fallback UI is shown
    expect(screen.getByText('System Error')).toBeInTheDocument();

    // Rerender with a safe component
    rerender(
      <ErrorBoundary>
        <div data-testid="child">Safe Content</div>
      </ErrorBoundary>
    );

    // Error state is still active until retry is clicked
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    // Now safe content should be rendered
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
