import localFont from "next/font/local";
import "./globals.css";

const vt323 = localFont({
  src: "./fonts/VT323-Regular.ttf",
  variable: "--font-vt323",
  weight: "400",
})

export const metadata = {
  title: "Kizuna Survivors",
  description: "A survival game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>
      </head>
      <body
        className={`${vt323.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
