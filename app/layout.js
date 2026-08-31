import './globals.css';

export const metadata = {
  title: 'Australian Payroll Association',
  description:
    'Membership, training, and consulting for payroll professionals across Australia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
