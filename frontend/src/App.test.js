import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing headline', () => {
  // Basic smoke test: the default route should still load the landing page hero.
  render(<App />);
  const heading = screen.getByText(/split bulk groceries\. save more together\./i);
  expect(heading).toBeInTheDocument();
});
