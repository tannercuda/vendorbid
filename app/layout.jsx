export const metadata = {
  title: "New Community Bid Portal (POC)",
  description: "Builder + Subcontractor proof of concept",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div className="brand">
            <div className="logo">NCB</div>
            <div>
              <div className="title">New Community Bid Portal — POC</div>
              <div className="subtitle">Static demo deployable to Vercel</div>
            </div>
          </div>
          <div className="nav">
            <a href="/" className="link">Home</a>
            <a href="/builder" className="link">Builder</a>
            <a href="/sub" className="link">Subcontractor</a>
          </div>
        </div>
        <main className="container">{children}</main>
        <footer className="footer">
          <div><b>Note:</b> This is a demo-only prototype. Data is stored in your browser (localStorage).</div>
        </footer>
      </body>
    </html>
  );
}
