import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Only2Bali — Vegetarian, Jain & Vegan Bali Group Tours from India",
  description:
    "India's first Bali travel platform exclusively for vegetarian, Jain and vegan group travelers. Customized itineraries, Jain-protocol kitchens, Indian-language guides, and accompanying cooks for groups of 10+.",
  openGraph: {
    title: "Only2Bali — Pure Veg, Jain & Vegan Bali Travel from India",
    description:
      "Customized Bali group tours with 100% vegetarian, Jain and vegan meals.",
    type: "website",
    url: "https://only2bali.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <nav aria-label="Main navigation">
          <div className="wrap navrow">
            <Link className="brand" href="/">Only<span>2</span>Bali</Link>
            <div className="links">
              <Link href="/#packages">Packages</Link>
              <Link href="/planner">Planner</Link>
              <Link href="/food">Food Protocols</Link>
              <Link href="/about">Stays &amp; Cook</Link>
              <Link href="/vendors">For Vendors</Link>
              <Link href="/faq">FAQ</Link>
              <Link className="btn btn-p" href="/inquiry">Plan My Trip</Link>
            </div>
          </div>
        </nav>
        {children}
        <footer>
          <div className="wrap">
            <div className="frow">
              <div>
                <Link className="brand" style={{ color: "#fff" }} href="/">
                  Only<span>2</span>Bali
                </Link>
                <p style={{ marginTop: ".8rem", maxWidth: "340px" }}>
                  India&apos;s first Bali travel platform built exclusively for vegetarian, Jain and vegan group travelers. Premium customization, cultural fluency, zero food anxiety.
                </p>
              </div>
              <div>
                <b style={{ color: "#fff" }}>Explore</b>
                <br /><br />
                <Link href="/#packages">Packages</Link><br />
                <Link href="/planner">Itinerary Planner</Link><br />
                <Link href="/about">Stays &amp; Cook</Link><br />
                <Link href="/vendors">Vendor Onboarding</Link>
              </div>
              <div>
                <b style={{ color: "#fff" }}>Contact</b>
                <br /><br />
                <a href="https://wa.me/6281200000000" target="_blank" rel="noopener noreferrer">WhatsApp us</a><br />
                <a href="mailto:hello@only2bali.com">hello@only2bali.com</a>
                <br /><br />
                <span style={{ fontSize: ".78rem" }}>
                  Serving travelers from Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Ahmedabad &amp; Kolkata.
                </span>
              </div>
            </div>
            <div className="foot-note">
              © 2026 Only2Bali. All rights reserved. ·{" "}
              <Link href="/privacy">Privacy Policy</Link> ·{" "}
              <Link href="/terms">Terms &amp; Conditions</Link> · Draft site — pricing indicative, sample content labeled.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
