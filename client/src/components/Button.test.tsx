import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { Button, PlayButton, FireButton } from './Button';

describe('Button Component', () => {
  describe('Basic Button', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gold-gradient');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-gold-500');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gold-500');
    });

    it('should show loading state', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">→</span>}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">←</span>}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('PlayButton', () => {
    it('should render play button', () => {
      render(<PlayButton />);
      expect(screen.getByLabelText('Play video')).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<PlayButton onClick={handleClick} />);
      await user.click(screen.getByLabelText('Play video'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('FireButton', () => {
    it('should render fire button with level', () => {
      render(<FireButton level={3} />);
      expect(screen.getByLabelText('Give 3 fires - Praise this post')).toBeInTheDocument();
    });

    it('should apply active styles when active', () => {
      render(<FireButton level={1} active={true} />);
      const button = screen.getByLabelText('Give 1 fire - Remove praise');
      expect(button.className).toContain('scale-125');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<FireButton level={2} onClick={handleClick} />);
      await user.click(screen.getByLabelText('Give 2 fires - Praise this post'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
