import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logService } from "@/services/logService";

type Props = {
  children: ReactNode;
  fallbackLabel?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
};

function extractComponentName(stack: string | null): string {
  if (!stack) return "不明";
  const match = stack.match(/in (\w+)/);
  return match?.[1] ?? "不明";
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const componentStack = info.componentStack ?? null;
    this.setState({ componentStack });

    logService.error("ERROR", error.message, {
      stack: error.stack,
      componentStack,
      component: extractComponentName(componentStack),
    });
  }

  private handleReload = () => {
    location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, componentStack } = this.state;
    const componentName = extractComponentName(componentStack);
    const isDev = import.meta.env.DEV;

    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto mt-20">
        <h2 className="text-rose-600 font-bold text-xl mb-2">
          {isDev
            ? `エラー: ${componentName}`
            : "エラーが発生しました"}
        </h2>

        {isDev ? (
          <DevErrorDetail
            error={error}
            componentStack={componentStack}
          />
        ) : (
          <p className="text-slate-600 mb-6">
            エラーが発生しました。再読み込みしてください。
          </p>
        )}

        <button
          onClick={this.handleReload}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors"
        >
          アプリを再読み込み
        </button>
      </div>
    );
  }
}

function DevErrorDetail({
  error,
  componentStack,
}: {
  error: Error | null;
  componentStack: string | null;
}) {
  return (
    <>
      <p className="text-slate-700 mb-4 text-sm">{error?.message}</p>

      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
          スタックトレース
        </summary>
        <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto max-h-48 font-mono">
          {error?.stack}
        </pre>
      </details>

      {componentStack && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
            コンポーネントスタック
          </summary>
          <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto max-h-48 font-mono">
            {componentStack}
          </pre>
        </details>
      )}
    </>
  );
}
