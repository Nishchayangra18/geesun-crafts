import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { StoreProvider } from "@/components/providers/store-provider";

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Geesun Crafts | Timeless Art for Your Home",
  description:
    "Discover premium handmade paintings from Geesun Crafts. Curated modern, abstract, and traditional art for elegant homes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <StoreProvider>{children}</StoreProvider>
        <Script
          id="strip-extension-form-attributes"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const attributeName = "fdprocessedid";
                const stripAttribute = (node) => {
                  if (!node || node.nodeType !== 1) return;
                  if (node.hasAttribute(attributeName)) {
                    node.removeAttribute(attributeName);
                  }
                  node.querySelectorAll?.("[" + attributeName + "]").forEach((element) => {
                    element.removeAttribute(attributeName);
                  });
                };

                stripAttribute(document.documentElement);

                const observer = new MutationObserver((mutations) => {
                  for (const mutation of mutations) {
                    stripAttribute(mutation.target);
                    mutation.addedNodes.forEach(stripAttribute);
                  }
                });

                observer.observe(document.documentElement, {
                  attributes: true,
                  attributeFilter: [attributeName],
                  childList: true,
                  subtree: true,
                });

                window.addEventListener("load", () => {
                  window.setTimeout(() => observer.disconnect(), 3000);
                }, { once: true });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
