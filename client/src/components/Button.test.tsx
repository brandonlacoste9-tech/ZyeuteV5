import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';

// Example test file - replace with actual Button component when available
describe('Button Component', () => {
  it('should render button with text', () => {
    render(<button>Click me</button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<button onClick={handleClick}>Click me</button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<button disabled>Disabled</button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
