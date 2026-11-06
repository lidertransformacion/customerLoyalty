import { useEffect, useState } from "react";

/** A desktop-wide window (1024 px and up): the book opens as a spread and screens take two columns. */
export function useWide(): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return wide;
}
