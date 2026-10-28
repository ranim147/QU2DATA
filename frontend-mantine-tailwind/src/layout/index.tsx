import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

function Layout(props: LayoutProps) {
  return <div style={{ minHeight: "100vh" }}>{props.children}</div>;
}

export default Layout;
