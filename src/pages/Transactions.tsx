import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseMultipleEntries } from "@/lib/ledgerParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerFiles, setLedgerFiles] = useState<LedgerFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        description: `Parsed ${parsedTransactions.length} transactions from File ${selectedFile.id}`,
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

  const formatAmount = (amount: number, currency: string | null) => {
    const formatted = Math.abs(amount).toLocaleString();
    const sign = amount >= 0 ? "+" : "-";
    return `${sign}${formatted}${currency || ""}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Transactions
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedFileId} onValueChange={setSelectedFileId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a ledger file" />
            </SelectTrigger>
            <SelectContent>
              {ledgerFiles.map((file) => (
                <SelectItem key={file.id} value={file.id.toString()}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File {file.id}
                    {file.is_primary && <Badge variant="secondary">Primary</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Count */}
      {transactions.length > 0 && (
        <div className="mb-6">
          <Badge variant="outline" className="text-sm">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </Badge>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {selectedFileId ? "The selected file doesn't contain any valid transactions." : "Select a ledger file to view transactions."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
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
  );
};

export default Transactions;