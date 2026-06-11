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
        baseDiv.createEl("h4", { text: "Thesis Under Debate" });

        if (!this.thesis) {
            baseDiv.createEl("p", { text: "No thesis selected. Highlight text and trigger 'Challenge My Thinking'." });
            return;
        }

        baseDiv.createEl("blockquote", { text: this.thesis });
    }

    async onClose() {
    }
}
