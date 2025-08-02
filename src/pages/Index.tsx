import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { FileText, Calendar } from "lucide-react";

const Index = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("ledger_files")
        .insert([{ content: content.trim() }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ledger file saved successfully!",
      });
      setContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ledger file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Ledger CLI Manager</h1>
          <p className="text-muted-foreground text-lg">
            Manage your accounting ledger files with powerful editing and parsing tools
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Link to="/ledger">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Ledger Manager
                </CardTitle>
                <CardDescription>
                  Create and manage your ledger files with syntax highlighting
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link to="/transactions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  View Transactions
                </CardTitle>
                <CardDescription>
                  Parse and view transactions from your ledger files
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Quick Upload Section */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Quick Upload</CardTitle>
              <CardDescription>
                Paste your ledger file content below for quick upload
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <label htmlFor="ledger-content" className="text-sm font-medium mb-2 block">
                  Paste your .ledger file content
                </label>
                <Textarea
                  id="ledger-content"
                  placeholder="Enter your ledger file content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Saving..." : "Save to Supabase"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;