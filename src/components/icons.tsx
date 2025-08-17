import { Music4 } from "lucide-react";
import type { SVGProps } from "react";

export function SpotifyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m4.026 14.537c-.24.36-.69.47-1.05.23c-2.91-1.78-6.55-2.17-10.94-.99c-.43.12-.87-.16-.99-.59c-.12-.43.16-.87.59-.99c4.8-1.28 8.85- .83 12.08.97c.39.24.47.76.23 1.05m1.02-2.31c-.29.43-.82.59-1.25.29c-3.3-2.03-8.24-2.63-12.21-1.44c-.51.15-.92-.22-1.07-.73c-.15-.51.22-.92.73-1.07c4.46-1.32 9.89-.66 13.67 1.62c.44.29.59.82.29 1.25m.09-2.42c-3.83-2.34-10.14-2.55-14.03-1.4c-.6.18-1.23-.22-1.41-.82c-.18-.6.22-1.23.82-1.41c4.32-1.24 11.1-1.01 15.42 1.58c.55.33.74.99.41 1.54c-.33.55-.99.74-1.54.41"
      ></path>
    </svg>
  );
}

export function Logo(props: SVGProps<SVGSVGElement>) {
  return <Music4 {...props} />;
}
