import { App, TFile } from "obsidian";

export interface SearchResult {
    file: TFile;
    score: number;
}

export class TfidEngine {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }


    public tokenize(text: string): string[] {
       if(!text) return [];
      

     const clean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n\r]/g, " ");
       const words = clean.split(/\s+/);


    const stopwords = new Set(["the", "a", "and", "is", "in", "to", "of", "that", "it", "for", "on", "with", "as", "this", "but", "by", "are"]);

      return words.filter(w => w.length > 1 && !stopwords.has(w));
    }

  
    private computeTf(tokens: string[]): Map<string, number> {
    const tfMap = new Map<string, number>();
      if(tokens.length === 0) return tfMap;

    for (const token of tokens) {
        tfMap.set(token, (tfMap.get(token) || 0) + 1);
    }

    for (const [token, count] of tfMap.entries()) {
        tfMap.set(token, count / tokens.length);
    }

    return tfMap;
    }



   
   
   
   
   
   
   
    public async crawlVault(): Promise<TFile[]> {
        const files = this.app.vault.getFiles();
        console.log("vault files scanned:", files.length);
        return files;
    }










    public async search(thesis: string, count = 5): Promise<SearchResult[]> {
        console.log("searching vault for:", thesis);

        return [];
    }
}