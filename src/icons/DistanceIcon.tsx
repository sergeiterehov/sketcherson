import React from "react";

export default function DistanceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="5.35355" y1="5.64645" x2="19.3536" y2="19.6464" stroke="#FF0000" />
      <circle cx="5.5" cy="5.5" r="1.5" fill="black" />
      <circle cx="19.5" cy="19.5" r="1.5" fill="black" />
    </svg>
  );
}
