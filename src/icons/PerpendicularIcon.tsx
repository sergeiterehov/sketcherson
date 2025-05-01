import React from "react";

export default function PerpendicularIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="16.5" y1="21" x2="16.5" y2="3" stroke="black" />
      <line x1="3" y1="17.5" x2="21" y2="17.5" stroke="black" />
      <line x1="9" y1="10.5" x2="16" y2="10.5" stroke="#FF0000" />
      <line x1="9.5" y1="17" x2="9.5" y2="10" stroke="#FF0000" />
    </svg>
  );
}
