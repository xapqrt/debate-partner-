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


        const ribbonIconEl = this.addRibbonIcon('swords', 'Debate Partner',(evt: MouseEvent) => {
         console.log("ribbon clicked, but need editor selection for thesis_junk");
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

        async handleChallenge(thesis_junk: string) {
         console.log("handling debate challenge for:", thesis_junk);
        }
    }