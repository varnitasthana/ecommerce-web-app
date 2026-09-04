import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from '../pages/Login';

const login = vi.fn();

vi.mock('../services/api', () => ({
  default: { post: vi.fn() }
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ login })
}));

describe('Login form', () => {
  it('keeps typed credentials visible to the input model', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);

    const email = screen.getByPlaceholderText('Email');
    const password = screen.getByPlaceholderText('Password');

    fireEvent.change(email, { target: { value: 'customer@example.com' } });
    fireEvent.change(password, { target: { value: 'DemoPassword#123' } });

    expect(email).toHaveValue('customer@example.com');
    expect(password).toHaveValue('DemoPassword#123');
  });
});
