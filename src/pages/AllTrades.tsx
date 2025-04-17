
import React from 'react';
import { TradeList } from '@/components/trade-list/TradeList';

export default function AllTrades() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">All Trades</h1>
      <TradeList />
    </div>
  );
}
