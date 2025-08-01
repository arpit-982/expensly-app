import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Ledger File Upload</h1>
            <Link to="/ledger">
              <Button variant="outline">
                Open Ledger Manager
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">Paste your .ledger file content below</p>
        </div>
        
        <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default Index;
