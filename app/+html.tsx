import { ScrollViewStyleReset } from "expo-router/html";
import type { ReactNode } from "react";

const registration = `
if ('serviceWorker' in navigator) {
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!local) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
    });
  }
}
`;

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Libertario</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1b1612" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: background }} />
        <script dangerouslySetInnerHTML={{ __html: registration }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const background = `
html, body, #root { height: 100%; }
body { margin: 0; background: #fff; }
`;
