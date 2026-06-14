# testing guide

so you wanna make sure this plugin works? here's how to test it.

---

## how to set it up

1. build the plugin first:
   ```bash
   npm run build
   ```

2. create a plugin folder inside your vault's `.obsidian` directory:
   ```bash
   mkdir -p .obsidian/plugins/debate-partner
   ```

3. copy the built files over:
   ```bash
   cp main.js manifest.json styles.css .obsidian/plugins/debate-partner/
   ```

4. reload obsidian or toggle the plugin to active under community plugins in settings.

---

## how to test it

1. open `Thesis Note.md` in your vault (or write a quick note).
2. put your cursor inside a paragraph.
3. click the swords ribbon icon on the left (or run the `Challenge My Thinking` command).
4. look at the sidebar to see the complicating notes ranked by relevance.
