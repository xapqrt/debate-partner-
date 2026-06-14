import { Plugin, Notice, PluginSettingTab, Setting, App, MarkdownView } from "obsidian";
import { TfidEngine, ContradictionResult } from "./search";
import { DebatePartnerView, DEBATE_PARTNER_VIEW_TYPE } from "./view";

interface DebatePartnerSettings {
    contextCount: number;
}

const DEFAULT_SETTINGS: DebatePartnerSettings = {
    contextCount: 5
};

export default class DebatePartnerPlugin extends Plugin {
    settings: DebatePartnerSettings = DEFAULT_SETTINGS;

    async onload() {
        console.log("loading debate partner... time to argue with your past self");

        await this.loadSettings();

        this.registerView(
            DEBATE_PARTNER_VIEW_TYPE,
            (leaf) => new DebatePartnerView(leaf)
        );

        const ribbonIconEl = this.addRibbonIcon('swords', 'Debate Partner', async (evt: MouseEvent) => {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                const editor = activeView.editor;
                const thesis = this.getThesisText(editor);
                if (thesis && thesis.trim() !== "") {
                    await this.handleChallenge(thesis);
                    return;
                }
            }
            await this.activateView();
        });
        ribbonIconEl.addClass('debate-partner-ribbon-class');

        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Debate Partner: Ready');

        this.addCommand({
            id: "challenge-my-thinking",
            name: "Challenge My Thinking",
            editorCallback: async (editor, view) => {
                const thesis = this.getThesisText(editor);
                await this.handleChallenge(thesis);
            }
        });

        this.addSettingTab(new DebatePartnerSettingTab(this.app, this));
    }

    onunload() {
        console.log("unloaded debate partner. peace.");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    getThesisText(editor: any): string {
        const selection = editor.getSelection();
        if (selection && selection.trim() !== "") {
            return selection;
        }

        const cursor = editor.getCursor();
        const lineCount = editor.lineCount();
        const cursorLine = cursor.line;
        
        let startLine = cursorLine;
        let endLine = cursorLine;

        while (startLine > 0) {
            const line = editor.getLine(startLine - 1).trim();
            if (line === "" || line.startsWith("#")) {
                break;
            }
            startLine--;
        }

        while (endLine < lineCount - 1) {
            const line = editor.getLine(endLine + 1).trim();
            if (line === "" || line.startsWith("#")) {
                break;
            }
            endLine++;
        }

        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(editor.getLine(i));
        }

        return lines.join("\n").trim();
    }

    async handleChallenge(thesisText: string) {
        if (!thesisText || thesisText.trim() === "") {
            new Notice("No thesis selected! Place your cursor in a paragraph or highlight text first.");
            return;
        }

        new Notice(`Challenging "${thesisText.substring(0, 30)}..."`);
        console.log("editor api is grabbing the highlighted text:", thesisText);

        const engine = new TfidEngine(this.app);
        const activeFile = this.app.workspace.getActiveFile();
        const contradictions = await engine.findContradictions(thesisText, this.settings.contextCount, activeFile);

        console.log("contradictions found:", contradictions.length);

        if (contradictions.length === 0) {
            new Notice("No contradicting notes found in the vault. Your ego is safe... for now.");
        } else {
            new Notice(`Found ${contradictions.length} notes that complicate your thesis!`);
        }

        await this.activateView();
        const leaf = this.app.workspace.getLeavesOfType(DEBATE_PARTNER_VIEW_TYPE)[0];
        if (leaf) {
            const view = leaf.view as DebatePartnerView;
            view.updateContradictions(thesisText, contradictions);
        }
    }

    async activateView() {
        const { workspace } = this.app;

        let theSidebar = workspace.getLeavesOfType(DEBATE_PARTNER_VIEW_TYPE)[0];
        if (!theSidebar) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({
                    type: DEBATE_PARTNER_VIEW_TYPE,
                    active: true,
                });
                theSidebar = rightLeaf;
            }
        }

        if (theSidebar) {
            workspace.revealLeaf(theSidebar);
        }
    }
}

class DebatePartnerSettingTab extends PluginSettingTab {
    plugin: DebatePartnerPlugin;

    constructor(app: App, plugin: DebatePartnerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Context Count")
            .setDesc("How many vault notes to pull in as potential contradictions.")
            .addSlider((slider) =>
                slider
                    .setLimits(1, 15, 1)
                    .setValue(this.plugin.settings.contextCount)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.contextCount = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
