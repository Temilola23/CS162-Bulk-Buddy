import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import ApiProvider from '../contexts/ApiProvider';
import { SessionProvider } from '../contexts/SessionProvider';

test('renders landing headline', () => {
  // Basic smoke test: the default route should still load the landing page hero.
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/']}
    >
      <ApiProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ApiProvider>
    </MemoryRouter>,
  );
  const heading = screen.getByText(/split bulk groceries\. save more together\./i);
  expect(heading).toBeInTheDocument();
});
