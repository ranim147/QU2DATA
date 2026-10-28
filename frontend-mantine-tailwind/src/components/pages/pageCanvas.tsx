import { useEffect, useRef, useState } from "react";
import { Box } from "@mantine/core";
import { Page } from "../../types/page.types";

interface Props {
  page: Page;
  children?: React.ReactNode;
}

export default function PageCanvas({ page, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Recalculate the scale so the page fits the available width,
  // keeping the exact aspect ratio (width / height) of the page.
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.offsetWidth;
      const newScale = Math.min(1, availableWidth / page.width);
      setScale(newScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [page.width, page.id]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "24px 0",
        backgroundColor: "#f1f3f5",
      }}
    >
      <Box
        sx={{
          width: page.width,
          height: page.height,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e9ecef",
          position: "relative",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}