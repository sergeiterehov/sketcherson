import React from "react";

export default function ParallelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="9.96885" y1="17.324" x2="19.6464" y2="7.64645" stroke="black" />
      <line x1="4.64645" y1="17.324" x2="14.324" y2="7.64645" stroke="#FF0000" />
    </svg>
  );
}
