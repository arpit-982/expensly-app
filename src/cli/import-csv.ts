import { enrichWithAutoTags } from '../services/autoTagService.js';
import { AutoTagInput } from '../types/autotag.js';
import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

// A simple script to test the auto-tagging service from the command line.
// Usage: bun src/cli/import-csv.ts <path_to_csv_file>

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a path to a CSV file.');
    process.exit(1);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    const drafts = records.map((rec: any, index: number) => ({
      id: `csv-${index}`,
      input: {
        date: rec.Date,
        amount: parseFloat(rec.Amount),
        rawNarration: rec.Description,
      } as AutoTagInput,
    }));

    console.log(`Processing ${drafts.length} transactions from ${filePath}...`);
    const results = await enrichWithAutoTags(drafts, { rules: [] });

    console.log('Auto-tagging complete. Results:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();
