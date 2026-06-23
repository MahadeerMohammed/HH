import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface WorkspacePageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  notices?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const WorkspacePage = ({ title, description, actions, notices, children, className }: WorkspacePageProps) => (
  <section className={["workspace-page", className].filter(Boolean).join(" ")}>
    <div className="workspace-page__header">
      <PageHeader title={title} description={description} actions={actions} />
      {notices ? <div className="workspace-page__notices">{notices}</div> : null}
    </div>
    <div className="workspace-page__content">{children}</div>
  </section>
);
