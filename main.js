import { Plugin } from "obsidian";

interface DebatePartnerSettings {
    ollmaUrl: string;
    ollmaModel: string;
}

const DEFAULT_SETTINGS: DebatePartnerSettings = {
    ollmaUrl: "http://localhost:11434",
    ollmaModel: "llama3"
};

export default class DebatePartnerPlugin extends Plugin {
        settings: DebatePartnerSettings = DEFAULT_SETTINGS;

        async onload() {
            console.log("loding debate partner... M4 is warming up");

            await this.loadSettings();


        }

        onunload() {
            console.log("unloaded debate partner.peace.");
        }

        async loadSettings() {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        }

        async saveSettings() {
            await this.saveData(this.settings);
        }
}