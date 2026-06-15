import { dict } from '@/lib/dict';

export default function LoadingSpinner({ text = dict.actions.loading }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
        <p className="mt-4 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}
