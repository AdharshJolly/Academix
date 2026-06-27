import React from 'react';
import { render } from '@testing-library/react';
import SkeletonCard from '../../../components/shared/SkeletonCard';

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    // Check that it renders the main div with the vintage-panel class
    expect(container.firstChild).toHaveClass('vintage-panel');
  });
});
