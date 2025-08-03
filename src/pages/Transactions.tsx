import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseMultipleEntries } from "@/lib/ledgerParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { ViewToggle } from "@/components/transactions/ViewToggle";
import { TransactionRow } from "@/data/sampleTransactions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFilter } from "@/contexts/FilterContext";
import { filterTransactions } from "@/lib/filterEngine";
import { FilterBuilder } from "@/components/filters/FilterBuilder";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Posting {
  account: string;
  amount: number;
  currency: string | null;
}

interface Transaction {
  date: string;
  payee: string;
  comments: string[];
  postings: Posting[];
}

interface LedgerFile {
  id: number;
  name: string;
  content: string;
  is_primary: boolean;
  created_at: string;
  last_updated_at: string;
}

const Transactions = () => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerFiles, setLedgerFiles] = useState<LedgerFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { filterConfig, hasActiveFilters } = useFilter();

  useEffect(() => {
    fetchLedgerFiles();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      parseSelectedFile();
    }
  }, [selectedFileId]);

  const fetchLedgerFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("ledger_files")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("last_updated_at", { ascending: false });

      if (error) throw error;

      const typedData = (data as LedgerFile[]) || [];
      setLedgerFiles(typedData);
      
      // Auto-select primary file or first file
      const primaryFile = typedData.find(f => f.is_primary);
      const defaultFile = primaryFile || typedData[0];
      if (defaultFile) {
        setSelectedFileId(defaultFile.id.toString());
      }
    } catch (error) {
      console.error("Error fetching ledger files:", error);
      toast({
        title: "Error",
        description: "Failed to fetch ledger files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseSelectedFile = async () => {
    const selectedFile = ledgerFiles.find(f => f.id.toString() === selectedFileId);
    if (!selectedFile) return;

    try {
      const parsedTransactions = parseMultipleEntries(selectedFile.content);
      // Sort by date descending (newest first)
      parsedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(parsedTransactions);
      
      toast({
        title: "Success",
        description: `Parsed ${parsedTransactions.length} transactions`,
      });
    } catch (error) {
      console.error("Error parsing transactions:", error);
      toast({
        title: "Error",
        description: "Failed to parse transactions",
        variant: "destructive",
      });
    }
  };

  // Transform parsed transactions to table format
  const transformToTableData = (transactions: Transaction[]): TransactionRow[] => {
    return transactions.map((transaction, index) => {
      const debitAccounts: string[] = [];
      const creditAccounts: string[] = [];
      let amount = 0;

      transaction.postings.forEach(posting => {
        if (posting.amount > 0) {
          debitAccounts.push(posting.account);
          amount = posting.amount;
        } else {
          creditAccounts.push(posting.account);
        }
      });

      return {
        id: `${transaction.date}-${index}`,
        date: transaction.date,
        narration: transaction.payee,
        debitAccounts,
        creditAccounts,
        amount,
        tags: [] // Will be populated later when we add tagging functionality
      };
    });
  };

  const formatAmount = (amount: number, currency: string | null) => {
    const formatted = formatCurrency(amount);
    const sign = amount >= 0 ? "+" : "-";
    return `${sign}${formatted.replace(/^[^\d-]/, '')}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const tableData = transformToTableData(transactions);
  
  // Apply filters to transactions
  const filteredTransactions = filterTransactions(transactions, filterConfig);
  const filteredTableData = transformToTableData(filteredTransactions);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Transactions
          </h1>
          {!loading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
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
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filterConfig.groups.reduce((total, group) => total + group.conditions.length, 0)}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <FilterBuilder />
            </CollapsibleContent>
          </Collapsible>
          
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Content */}
      {transactions.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                No ledger files found or selected file doesn't contain valid transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[calc(100vh-200px)]">
          {viewMode === 'table' ? (
            <TransactionsTable transactions={filteredTableData} />
          ) : (
            <div className="space-y-4 h-full overflow-auto">
              {filteredTransactions.map((transaction, index) => (
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
      )}
    </div>
  );
};

export default Transactions;