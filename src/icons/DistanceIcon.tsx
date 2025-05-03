import React from "react";

export default function DistanceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="5.35355" y1="5.64645" x2="17.3536" y2="17.6464" stroke="#FF0000" />
      <circle cx="6" cy="6" r="2" fill="black" />
      <circle cx="18" cy="18" r="2" fill="black" />
    </svg>
  );
}
