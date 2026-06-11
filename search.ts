import { App, TFile } from "obsidian";

export interface SearchResult {
    file: TFile;
    score: number;
}

export interface ContradictionResult {
    file: TFile;
    relevanceScore: number;
    contradictionScore: number;
    overlapScore: number;
    linkedMentions: string[];
    excerpt: string;
}

export class TfidEngine {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    public tokenize(text: string): string[] {
        if (!text) return [];

        const clean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n\r]/g, " ");
        const words = clean.split(/\s+/);

        const stopwords = new Set([
            "the", "a", "and", "is", "in", "to", "of", "that", "it", "for",
            "on", "with", "as", "this", "but", "by", "are", "an", "be",
            "or", "not", "was", "were", "has", "have", "had", "will",
            "would", "could", "should", "may", "might", "can", "do", "does", "did"
        ]);

        return words.filter(w => w.length > 2 && !stopwords.has(w));
    }

    private computeTf(tokens: string[]): Map<string, number> {
        const tfMap = new Map<string, number>();
        if (tokens.length === 0) return tfMap;

        for (const token of tokens) {
            tfMap.set(token, (tfMap.get(token) || 0) + 1);
        }

        for (const [token, count] of tfMap.entries()) {
            tfMap.set(token, count / tokens.length);
        }

        return tfMap;
    }

    private computeIdf(allDocsTokens: string[][], terms: Set<string>): Map<string, number> {
        const idfMap = new Map<string, number>();
        const numDocs = allDocsTokens.length;

        for (const term of terms) {
            let docsWithTerm = 0;
            for (const tokens of allDocsTokens) {
                if (tokens.includes(term)) {
                    docsWithTerm++;
                }
            }

            idfMap.set(term, Math.log((numDocs + 1) / (docsWithTerm + 1)) + 1);
        }

        return idfMap;
    }

    public async crawlVault(): Promise<TFile[]> {
        const files = this.app.vault.getFiles().filter(f => f.extension === "md");
        console.log("vault files scanned:", files.length);
        return files;
    }

    public async search(thesis: string, count = 5): Promise<SearchResult[]> {
        console.log("searching vault for:", thesis);

        const thesisTokens = this.tokenize(thesis);
        if (thesisTokens.length === 0) return [];

        const files = await this.crawlVault();
        const allDocsTokens: string[][] = [];
        const docFiles: TFile[] = [];

        const readResults = await Promise.all(
            files.map(async (file) => {
                try {
                    const content = await this.app.vault.cachedRead(file);
                    return { file, tokens: this.tokenize(content) };
                } catch (e) {
                    return null;
                }
            })
        );

        for (const res of readResults) {
            if (res) {
                allDocsTokens.push(res.tokens);
                docFiles.push(res.file);
            }
        }

        const queryTerms = new Set(thesisTokens);
        const idfs = this.computeIdf(allDocsTokens, queryTerms);

        const results: SearchResult[] = [];

        for (let i = 0; i < allDocsTokens.length; i++) {
            const tokens = allDocsTokens[i];
            const tfs = this.computeTf(tokens);
            let mathScore = 0;

            for (const term of thesisTokens) {
                const tf = tfs.get(term) || 0;
                const idf = idfs.get(term) || 0;
                mathScore += tf * idf;
            }

            if (mathScore > 0) {
                results.push({
                    file: docFiles[i],
                    score: mathScore
                });
            }
        }

        return results.sort((a, b) => b.score - a.score).slice(0, count);
    }

    public async findContradictions(
        thesis: string,
        count = 5
    ): Promise<ContradictionResult[]> {
        console.log("hunting for contradictions to:", thesis);

        const thesisTokens = this.tokenize(thesis);
        if (thesisTokens.length === 0) return [];

        const files = await this.crawlVault();
        const fileContents = new Map<TFile, string>();
        const allDocsTokens: string[][] = [];
        const docFiles: TFile[] = [];

        const readResults = await Promise.all(
            files.map(async (file) => {
                try {
                    const content = await this.app.vault.cachedRead(file);
                    return { file, content, tokens: this.tokenize(content) };
                } catch (e) {
                    return null;
                }
            })
        );

        for (const res of readResults) {
            if (res) {
                allDocsTokens.push(res.tokens);
                docFiles.push(res.file);
                fileContents.set(res.file, res.content);
            }
        }

        const queryTerms = new Set(thesisTokens);
        const idfs = this.computeIdf(allDocsTokens, queryTerms);

        const contradictionIndicators = new Set([
            "however", "although", "but", "yet", "nevertheless", "nonetheless",
            "conversely", "contrary", "opposite", "versus", "against",
            "refute", "rebuttal", "counter", "challenge", "disagree",
            "dispute", "deny", "reject", "oppose", "unlike", "rather",
            "instead", "alternative", "false", "incorrect", "wrong"
        ]);

        const results: ContradictionResult[] = [];

        for (let i = 0; i < allDocsTokens.length; i++) {
            const tokens = allDocsTokens[i];
            const file = docFiles[i];
            const content = fileContents.get(file) || "";
            const tfs = this.computeTf(tokens);

            let relevanceScore = 0;
            for (const term of thesisTokens) {
                const tf = tfs.get(term) || 0;
                const idf = idfs.get(term) || 0;
                relevanceScore += tf * idf;
            }

            if (relevanceScore <= 0) continue;

            let overlapScore = 0;
            let contradictionScore = 0;

            for (const token of tokens) {
                if (contradictionIndicators.has(token)) {
                    contradictionScore += 1;
                }
            }
            contradictionScore = contradictionScore / (tokens.length || 1);

            const sharedTerms = new Set<string>();
            for (const term of tokens) {
                if (queryTerms.has(term)) {
                    sharedTerms.add(term);
                }
            }
            overlapScore = sharedTerms.size / queryTerms.size;

            const linkRegex = /\[\[([^\]|]+)\]\]/g;
            const linkedMentions: string[] = [];
            let match;
            while ((match = linkRegex.exec(content)) !== null) {
                linkedMentions.push(match[1]);
            }

            const backlinks = this.app.metadataCache.getBacklinksForFile(file);
            if (backlinks) {
                for (const path of backlinks.keys()) {
                    const fileName = path.replace(/\.md$/, "");
                    if (!linkedMentions.includes(fileName)) {
                        linkedMentions.push(fileName);
                    }
                }
            }

            let excerpt = "";
            const sentences = content.split(/(?<=[.!?])\s+/);
            for (const sentence of sentences) {
                const sentTokens = this.tokenize(sentence);
                let sharedCount = 0;
                for (const t of sentTokens) {
                    if (queryTerms.has(t)) sharedCount++;
                }
                if (sharedCount >= 1) {
                    excerpt = sentence.substring(0, 200);
                    if (sentence.length > 200) excerpt += "...";
                    break;
                }
            }
            if (!excerpt && content.length > 0) {
                excerpt = content.substring(0, 200) + "...";
            }

            results.push({
                file,
                relevanceScore,
                contradictionScore,
                overlapScore,
                linkedMentions,
                excerpt
            });
        }

        return results
            .sort((a, b) => {
                const scoreA = a.relevanceScore + a.contradictionScore * 3;
                const scoreB = b.relevanceScore + b.contradictionScore * 3;
                return scoreB - scoreA;
            })
            .slice(0, count);
    }
}
