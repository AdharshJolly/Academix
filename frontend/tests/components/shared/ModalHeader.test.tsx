import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModalHeader } from '../../../components/shared/ModalHeader';

describe('ModalHeader', () => {
  it('renders title and description correctly', () => {
    render(
      <ModalHeader 
        icon={<svg data-testid="test-icon"></svg>}
        title="Test Modal Title" 
        description="Test Modal Description" 
      />
    );
    
    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Test Modal Description')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom background and color classes', () => {
    const { container } = render(
      <ModalHeader 
        icon={<div />}
        title="Styled Modal" 
        description="Styled Description" 
        iconBgClass="custom-bg-class"
        iconColorClass="custom-color-class"
      />
    );
    
    const bgContainer = container.querySelector('.custom-bg-class');
    const colorContainer = container.querySelector('.custom-color-class');
    
    expect(bgContainer).toBeInTheDocument();
    expect(colorContainer).toBeInTheDocument();
  });
});
