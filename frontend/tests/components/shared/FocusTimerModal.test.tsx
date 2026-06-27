import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FocusTimerModal } from '../../../components/shared/FocusTimerModal';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardService } from '../../../services/dashboard.service';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/dashboard.service', () => ({
  DashboardService: {
    logStudySession: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('FocusTimerModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ token: 'mock-token' });
    jest.useFakeTimers();
    
    // Mock Audio
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not render if isOpen is false', () => {
    render(<FocusTimerModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Focus Mode')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    render(<FocusTimerModal isOpen={true} onClose={mockOnClose} taskTitle="Test Task" />);
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument(); // Initial 25 mins
  });

  it('can switch between focus and break modes', () => {
    render(<FocusTimerModal isOpen={true} onClose={mockOnClose} />);
    
    const breakBtn = screen.getByRole('button', { name: /Break/i });
    fireEvent.click(breakBtn);
    
    expect(screen.getByText('05:00')).toBeInTheDocument(); // 5 mins break
    
    const focusBtn = screen.getByRole('button', { name: /Focus/i });
    fireEvent.click(focusBtn);
    
    expect(screen.getByText('25:00')).toBeInTheDocument(); // 25 mins focus
  });

  it('starts counting down when play is clicked', () => {
    render(<FocusTimerModal isOpen={true} onClose={mockOnClose} />);
    
    const playButton = screen.getAllByRole('button')[3]; // Play is the 4th button (Close, Focus, Break, Reset, Play/Pause)
    // Actually let's find it by SVG or just play safe by class/svg. Or we can just click the 5th button.
    // Close(1), Focus(2), Break(3), Reset(4), Play(5)
    const buttons = screen.getAllByRole('button');
    const playBtn = buttons[buttons.length - 1]; // The last one is the play/pause toggle
    
    fireEvent.click(playBtn);
    
    act(() => {
      jest.advanceTimersByTime(1000); // 1 second
    });
    
    expect(screen.getByText('24:59')).toBeInTheDocument();
  });

  it('logs study session when timer completes in focus mode', async () => {
    (DashboardService.logStudySession as jest.Mock).mockResolvedValue({ success: true });
    
    render(<FocusTimerModal isOpen={true} onClose={mockOnClose} taskId="task-123" taskTitle="Math" />);
    
    const buttons = screen.getAllByRole('button');
    const playBtn = buttons[buttons.length - 1];
    
    // Start timer
    fireEvent.click(playBtn);
    
    // Fast forward to end
    await act(async () => {
      jest.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
    });
    
    expect(DashboardService.logStudySession).toHaveBeenCalledWith({
      duration_minutes: 25,
      title: 'Math',
      task_id: 'task-123'
    }, 'mock-token');
    
    // Should switch to break mode (05:00)
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });
});
