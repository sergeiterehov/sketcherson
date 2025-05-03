import React from "react";

export default function AngleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M6.5 15C6.5 13.7524 6.74573 12.5171 7.22314 11.3645C7.70056 10.2119 8.40033 9.16464 9.28249 8.28248"
        stroke="#FF0000"
      />
      <line x1="5.35355" y1="4.64645" x2="18.0815" y2="17.3744" stroke="black" />
      <line x1="3" y1="14.5" x2="21" y2="14.5" stroke="black" />
    </svg>
  );
}
