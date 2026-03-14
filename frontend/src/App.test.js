import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing headline', () => {
  render(<App />);
  const heading = screen.getByText(/split bulk groceries\. save more together\./i);
  expect(heading).toBeInTheDocument();
});
