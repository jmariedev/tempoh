// The portfolio's own domain isn't live yet, so the credit links to its Vercel address.
const PORTFOLIO_URL = "https://jmarie-dev-ochre.vercel.app";

/** A small credit at the very bottom of the page. */
export default function Credit() {
  return (
    <footer className="credit">
      <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
        designed and built by <b>jmarie.dev</b>
      </a>
    </footer>
  );
}
