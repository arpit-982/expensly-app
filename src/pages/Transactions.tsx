import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { ViewToggle } from "@/components/transactions/ViewToggle";
import { sampleTransactions, TransactionRow } from "@/data/sampleTransactions";

interface Transaction {
  date: string;
  payee: string;
  comments: string[];
  postings: {
    account: string;
    amount: number;
    currency: string | null;
  }[];
}

const Transactions = () => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [transactions] = useState<TransactionRow[]>(sampleTransactions);

  // Transform sample data to match legacy Transaction format for card view
  const legacyTransactions: Transaction[] = transactions.map(t => ({
    date: t.date,
    payee: t.narration,
    comments: [],
    postings: [
      { account: t.debitAccounts[0] || 'Unknown', amount: t.amount, currency: '$' },
      { account: t.creditAccounts[0] || 'Unknown', amount: -t.amount, currency: '$' }
    ]
  }));

  const formatAmount = (amount: number, currency: string | null) => {
    const formatted = Math.abs(amount).toLocaleString();
    const sign = amount >= 0 ? "+" : "-";
    return `${sign}${formatted}${currency || ""}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Transactions
          </h1>
          <Badge variant="outline" className="text-sm">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <ViewToggle 
          viewMode={viewMode} 
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-200px)]">
        {viewMode === 'table' ? (
          <TransactionsTable transactions={transactions} />
        ) : (
          <div className="space-y-4 h-full overflow-auto">
            {legacyTransactions.map((transaction, index) => (
              <Card key={index} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{transaction.payee}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{transaction.date}</Badge>
                  </div>
                  
                  {transaction.comments.length > 0 && (
                    <div className="mt-2">
                      {transaction.comments.map((comment, commentIndex) => (
                        <p key={commentIndex} className="text-sm text-muted-foreground italic">
                          {comment}
                        </p>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {transaction.postings.map((posting, postingIndex) => (
                      <div key={postingIndex}>
                        <div className="flex items-center justify-between py-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {posting.account}
                          </span>
                          <span className={`font-mono text-sm font-medium ${getAmountColor(posting.amount)}`}>
                            {formatAmount(posting.amount, posting.currency)}
                          </span>
                        </div>
                        {postingIndex < transaction.postings.length - 1 && (
                          <Separator className="opacity-50" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;