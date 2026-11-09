import { Component, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { recoverApp } from '../offline/recoverApp';

class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean; busy: boolean; message: string }> {
  state = { failed: false, busy: false, message: '' };
  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="simple-page" role="alert">
      <h1>Sidan kunde inte laddas</h1>
      <p>Appen kan ha uppdaterats sedan den öppnades, eller så kunde sidans filer inte hämtas. Ladda om med internet för att försöka igen.</p>
      <button className="today-button" disabled={this.state.busy} onClick={() => {
        this.setState({ busy: true, message: '' });
        void recoverApp().catch(() => this.setState({ busy: false, message: 'Det gick inte att hämta appen på nytt. Kontrollera internetanslutningen och försök igen.' }));
      }}>{this.state.busy ? 'Hämtar senaste versionen…' : 'Hämta senaste versionen'}</button>
      {this.state.message && <p>{this.state.message}</p>}
      <p>Dina sparade kartor och prognoser tas inte bort.</p>
      <Link to="/">Till jakttider</Link>
    </section>;
  }
}

export default function PageErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <PageBoundary key={location.pathname}>{children}</PageBoundary>;
}
