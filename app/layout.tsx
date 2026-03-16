// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Inforum · Diagnóstico",
  description: "Cuestionario de diagnóstico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* === Google Tag Manager === */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-56FR9CD6');
          `}
        </Script>

        {/* === Microsoft Clarity === */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "to7g2gm7pi");`,
          }}
        />
      </head>

      <body className="min-h-screen bg-white text-gray-900 antialiased flex flex-col">
        {/* === Google Tag Manager (noscript) === */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-56FR9CD6"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* HEADER */}
        <header className="w-full bg-[#082a49]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
            <Image
              src="/logo-inforum.png"
              alt="Inforum"
              width={160}
              height={40}
              priority
            />
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-[#f5f5f5] py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Inforum
        </footer>
      </body>
    </html>
  );
}
