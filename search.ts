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

        return [];
    }










    public async crawlVault(): Promise<TFile[]> {

        return [];
    }










    public async search(thesis: string, count = 5): Promise<SearchResult[]> {
        console.log("searching vault for:", thesis);

        return [];
    }
}