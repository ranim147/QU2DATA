import { ReactNode } from "react";

export interface LayoutProps {
  children: ReactNode;
}
export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}
export interface PaginationOptions {
  limit: number;
  page: number;
}
