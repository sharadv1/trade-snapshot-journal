
import { TradeForm } from '@/components/TradeForm';

export default function TradeEntry() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Record New Trade
      </h1>
      <TradeForm />
    </div>
  );
}
