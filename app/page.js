import ContactForm from './contact-form';

export default function HomePage() {
  return (
    <>
      <header className="container">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">AP</span>
            <span>Australian Payroll Association</span>
          </div>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Payroll expertise, from people who do this every day.</h1>
          <p>
            Membership, training, and consulting for payroll professionals and
            the organisations they keep compliant. Tell us what you need and
            we&rsquo;ll be in touch.
          </p>
        </section>

        <section className="grid">
          <div className="pillars">
            <div className="pillar">
              <span className="dot" />
              <div>
                <h3>Membership</h3>
                <p>
                  Stay current with legislation, resources, and a community of
                  payroll professionals.
                </p>
              </div>
            </div>
            <div className="pillar">
              <span className="dot" />
              <div>
                <h3>Training</h3>
                <p>
                  Practical, accredited payroll courses that build real
                  capability in your team.
                </p>
              </div>
            </div>
            <div className="pillar">
              <span className="dot" />
              <div>
                <h3>Consulting</h3>
                <p>
                  Expert help with audits, compliance reviews, and payroll
                  transformation.
                </p>
              </div>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} Australian Payroll Association ·
          payrollgroup.com.au
        </div>
      </footer>
    </>
  );
}
