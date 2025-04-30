"use client";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./Editor"), { ssr: false, loading: () => "Editor is loading..." });

export default function Home() {
  return <Editor />;
}
