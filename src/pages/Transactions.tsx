import { Calendar, FileText, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilterBuilder } from '@/components/filters/FilterBuilder';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { ViewToggle } from '@/components/transactions/ViewToggle';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFilter } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';
import { ledgerService } from '@/services/ledgerService';
import type { Transaction, LedgerFile } from '@/types/ledger';
import { filterTransactions } from '@/lib/filterEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { FilterNode } from '@/types/filters';

const countConditions = (node: FilterNode): number => {
  // It's a condition
  if ('field' in node) {
    return 1;
  }

  // It's a group
  if ('children' in node) {
    return node.children.reduce((sum, child) => sum + countConditions(child), 0);
  }

  return 0;
};

const Transactions = () => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerFiles, setLedgerFiles] = useState<LedgerFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { filter: filterConfig, hasActiveFilters } = useFilter();

  useEffect(() => {
    fetchLedgerFiles();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchTransactions();
    }
  }, [selectedFileId]);

  const fetchLedgerFiles = async () => {
    try {
      const files = await ledgerService.getFiles();
      setLedgerFiles(files);

      // Auto-select primary file or first file
      const primaryFile = files.find((f) => f.is_primary);
      if (primaryFile) {
        setSelectedFileId(primaryFile.id);
      } else if (files.length > 0) {
        setSelectedFileId(files[0].id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      console.error('Error fetching ledger files:', error);
      toast({
        title: 'Error Fetching Files',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedFileId) return;

    try {
      const data = await ledgerService.listTransactions(selectedFileId);
      // Sort by date descending (newest first)
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error Fetching Transactions',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number, currency: string | null) => {
    const formatted = formatCurrency(amount);
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}${formatted.replace(/^[^\d-]/, '')}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Apply filters to transactions
  const filteredTransactions = filterTransactions(transactions, filterConfig);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Calendar className="h-8 w-8" />
            Transactions
          </h1>
          {!loading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredTransactions.length} of {transactions.length} transaction
                {transactions.length !== 1 ? 's' : ''}
              </Badge>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-sm">
                  Filtered
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {countConditions(filterConfig)}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <FilterBuilder />
            </CollapsibleContent>
          </Collapsible>

          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      {ledgerFiles.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Ledger Files Found</h3>
              <p className="text-muted-foreground">Please add a ledger file to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : transactions.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Transactions Found</h3>
              <p className="text-muted-foreground">
                The selected ledger file does not contain any valid transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[calc(100vh-200px)]">
          {viewMode === 'table' ? (
            <TransactionsTable transactions={filteredTransactions} />
          ) : (
            <div className="h-full space-y-4 overflow-auto">
              {filteredTransactions.map((transaction, index) => (
                <Card key={index} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{transaction.payee}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{transaction.date}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      {transaction.postings.map((posting, postingIndex) => (
                        <div key={postingIndex}>
                          <div className="flex items-center justify-between py-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {posting.account}
                            </span>
                            <span
                              className={`font-mono text-sm font-medium ${getAmountColor(posting.amount)}`}
                            >
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
      )}
    </div>
  );
};

export default Transactions;
