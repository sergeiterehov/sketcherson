import React from "react";

export default function AnyCoincidentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19.5205 16.1595C17.886 16.6093 16.1608 16.6135 14.5241 16.1717C12.8874 15.7299 11.3987 14.8581 10.2126 13.6469C9.02641 12.4356 8.18599 10.929 7.7785 9.28341C7.37102 7.6378 7.41132 5.91313 7.89523 4.28834"
        stroke="black"
      />
      <line x1="4.64645" y1="18.6464" x2="17.6464" y2="5.64645" stroke="black" />
      <circle cx="12" cy="11" r="3" fill="black" />
      <circle cx="10" cy="13" r="3" fill="#FF0000" />
    </svg>
  );
}
