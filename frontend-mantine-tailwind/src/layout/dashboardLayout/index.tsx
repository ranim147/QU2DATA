import { ReactNode } from "react";
import SideBar from "./sidebar";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

function DashboardLayout(props: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar />
      <div className="flex-1 overflow-y-auto bg-white p-6">
        {props.children}
      </div>
    </div>
  );
}

export default DashboardLayout;
