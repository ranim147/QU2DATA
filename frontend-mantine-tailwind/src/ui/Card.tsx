import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  padding?: boolean;
  className?: string;
}

export function Card({ children, padding = true, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
        padding ? "p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
