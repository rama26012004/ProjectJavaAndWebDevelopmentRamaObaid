/**
 * Import necessary modules and components for testing.
 */
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test case to verify that the "learn react" link is rendered and present in the document.
 */
test('renders learn react link', () => {
  // Render the App component
  render(<App />);
  // Get the link element by its text content
  const linkElement = screen.getByText(/learn react/i);
  // Assert that the link element is present in the document
  expect(linkElement).toBeInTheDocument();
});
