import React from "react";

export default function ArcIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="2" fill="black" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="black" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="black" />
      <path
        d="M17.3033 17.3033C15.8968 18.7098 13.9891 19.5 12 19.5C10.0109 19.5 8.10322 18.7098 6.6967 17.3033C5.29018 15.8968 4.5 13.9891 4.5 12C4.5 10.0109 5.29018 8.10322 6.6967 6.6967"
        stroke="black"
      />
    </svg>
  );
}
