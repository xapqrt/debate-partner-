import { Plugin, Notice, PluginSettingTab, Setting, App, TFile } from "obsidian";
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
        console.log("loading debate partner... ready to start fights with your own notes");

        await this.loadSettings();

        this.registerView(
            DEBATE_PARTNER_VIEW_TYPE,
            (leaf) => new DebatePartnerView(leaf)
        );

        const ribbonIconEl = this.addRibbonIcon('swords', 'Debate Partner', async (evt: MouseEvent) => {
            await this.activateView();
        });
        ribbonIconEl.addClass('debate-partner-ribbon-class');

        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Debate Partner: Ready');

        this.addCommand({
            id: "challenge-my-thinking",
            name: "Challenge My Thinking",
            editorCallback: async (editor, view) => {
                const selection = editor.getSelection();
                await this.handleChallenge(selection);
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

    async handleChallenge(thesisText: string) {
        if (!thesisText || thesisText.trim() === "") {
            new Notice("No thesis selected! Highlight some text first.");
            return;
        }

        new Notice(`Challenging "${thesisText.substring(0, 30)}..."`);
        console.log("editor api is grabbing the highlighted text:", thesisText);

        const engine = new TfidEngine(this.app);
        const contradictions = await engine.findContradictions(thesisText, this.settings.contextCount);

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
