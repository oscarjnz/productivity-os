"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  widgetType: string;
}

interface State {
  error: Error | null;
}

/**
 * Per-widget error fence. A crashing widget shows a fallback;
 * the rest of the dashboard keeps working.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error(`[widget:${this.props.widgetType}]`, error);
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-[var(--color-danger)]" aria-hidden />
          <div className="text-[12px] font-medium text-[var(--color-text-mid)]">
            Widget crashed
          </div>
          <div className="text-[11px] text-[var(--color-text-lo)]">
            {this.state.error.message.slice(0, 80)}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-1 text-[11px] text-[var(--color-accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
