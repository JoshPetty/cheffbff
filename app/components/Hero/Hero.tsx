import Link from "next/link";
import { Container } from "./styles";

export function Hero() {
  return (
    <Container>
      <div className="hero-content">
        <h1>
          <span className="gradient-text">The Home Cook's Best Friend</span>
        </h1>
        <p>
         Family Made App
        </p>
        <div className="cta-buttons">
          <Link href="/recipes" className="primary-button">
            Discover
          </Link>
          <Link href="/recipes/new" className="secondary-button">
            Share Yours
          </Link>
        </div>
      </div>
    </Container>
  );
}