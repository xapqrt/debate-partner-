import { ItemView, WorkspaceLeaf } from "obsidian";
import { ContradictionResult } from "./search";

export const DEBATE_PARTNER_VIEW_TYPE = "debate-partner-view";

export class DebatePartnerView extends ItemView {
    private thesis: string = "";
    private contradictions: ContradictionResult[] = [];
    private isLoading: boolean = false;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return DEBATE_PARTNER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Debate Partner";
    }

    public showLoading(thesis: string) {
        this.thesis = thesis;
        this.contradictions = [];
        this.isLoading = true;
        this.onOpen();
    }

    public updateContradictions(thesis: string, contradictions: ContradictionResult[]) {
        this.thesis = thesis;
        this.contradictions = contradictions;
        this.isLoading = false;
        this.onOpen();
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();

        const baseDiv = container.createEl("div", { cls: "debate-partner-container" });
        baseDiv.createEl("h4", { text: "Thesis Under Fire" });

        if (!this.thesis) {
            baseDiv.createEl("p", { text: "No thesis selected. Highlight text or place cursor on a paragraph." });
            return;
        }

        const thesisCard = baseDiv.createEl("div", { cls: "debate-thesis-card" });
        thesisCard.createEl("blockquote", { text: this.thesis });

        if (this.isLoading) {
            const loadingDiv = baseDiv.createEl("div", { cls: "debate-loading-container" });
            loadingDiv.createEl("div", { cls: "debate-spinner" });
            loadingDiv.createEl("p", { text: "Rifling through your vault for contradictions..." });
            return;
        }

        if (this.contradictions.length === 0) {
            baseDiv.createEl("p", {
                text: "No contradictions found. Either your thesis is bulletproof (unlikely) or your vault needs more spicy takes.",
                cls: "debate-empty-state"
            });
            return;
        }

        baseDiv.createEl("h4", { text: `Vault Contradictions (${this.contradictions.length})` });

        const listDiv = baseDiv.createEl("div", { cls: "debate-arguments-list" });

        for (const contradiction of this.contradictions) {
            const itemDiv = listDiv.createEl("div", { cls: "debate-arguments-item" });

            const headerDiv = itemDiv.createEl("div", { cls: "debate-arguments-header" });

            const badgeGroup = headerDiv.createEl("div", { cls: "debate-badge-group" });
            const severity = this.getSeverityLabel(contradiction.contradictionScore);
            badgeGroup.createEl("span", { cls: `debate-indicator debate-indicator-${severity.toLowerCase()}` });
            badgeGroup.createEl("span", {
                text: severity.toUpperCase(),
                cls: `debate-severity debate-severity-${severity.toLowerCase()}`
            });

            const titleEl = headerDiv.createEl("a", {
                text: contradiction.file.basename,
                cls: "internal-link debate-note-link"
            });
            titleEl.addEventListener("click", async (e) => {
                e.preventDefault();
                await this.app.workspace.openLinkText(contradiction.file.path, "", false);
            });

            const scoresDiv = itemDiv.createEl("div", { cls: "debate-scores-row" });
            scoresDiv.createEl("span", {
                text: `Relevance: ${contradiction.relevanceScore.toFixed(3)}`,
                cls: "debate-score-pill"
            });
            scoresDiv.createEl("span", {
                text: `Contradiction: ${contradiction.contradictionScore.toFixed(3)}`,
                cls: "debate-score-pill"
            });
            scoresDiv.createEl("span", {
                text: `Overlap: ${(contradiction.overlapScore * 100).toFixed(0)}%`,
                cls: "debate-score-pill"
            });

            if (contradiction.excerpt) {
                const excerptP = itemDiv.createEl("p", {
                    cls: "debate-arguments-text"
                });
                this.renderTextWithLinks(excerptP, contradiction.excerpt);
            }

            if (contradiction.linkedMentions.length > 0) {
                const linksDiv = itemDiv.createEl("div", { cls: "debate-pills-container" });
                for (const mention of contradiction.linkedMentions.slice(0, 5)) {
                    const pillEl = linksDiv.createEl("a", {
                        text: mention,
                        cls: "debate-pill-tag internal-link"
                    });
                    pillEl.addEventListener("click", async (e) => {
                        e.preventDefault();
                        await this.app.workspace.openLinkText(mention, "", true);
                    });
                }
            }
        }
    }

    private getSeverityLabel(score: number): string {
        if (score > 0.15) return "high";
        if (score > 0.05) return "medium";
        return "low";
    }

    private renderTextWithLinks(parentEl: HTMLElement, text: string) {
        const regex = /\[\[([^\]]+)\]\]/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const plainText = text.substring(lastIndex, match.index);
            if (plainText) {
                parentEl.appendChild(document.createTextNode(plainText));
            }

            const linkTarget = match[1];
            const linkEl = parentEl.createEl("a", {
                text: linkTarget,
                cls: "internal-link debate-citation-link"
            });
            linkEl.href = "#";
            linkEl.addEventListener("click", async (e) => {
                e.preventDefault();
                await this.app.workspace.openLinkText(linkTarget, "", true);
            });

            lastIndex = regex.lastIndex;
        }

        const remainingText = text.substring(lastIndex);
        if (remainingText) {
            parentEl.appendChild(document.createTextNode(remainingText));
        }
    }

    async onClose() {
    }
}
