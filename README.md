# Debate Partner

an obsidian plugin that weaponizes your own notes against you.

seriously. highlight some text in your notes, hit the ribbon icon (it looks like swords because this is combat), and watch the plugin rifle through your entire vault to find notes that directly contradict or complicate whatever you just claimed.

## what even is this
ever write a note, feel really good about it, and then realize you've already written something in your vault that proves you wrong? that's where this plugin steps in. it:

1. takes whatever text you highlighted
2. runs a custom tf-idf search engine over your markdown files
3. hunts for notes that share keywords but also contain contradiction markers
4. checks linked mentions and backlinks between notes
5. surfaces the most complicating evidence from your own knowledge base

it's like having your past self show up to tell you you're wrong. except your past self is just... you. writing notes.

## how the contradiction detection works

instead of outsourcing your critical thinking to an api, this plugin uses your actual vault:

### keyword overlap
finds notes that share vocabulary with your thesis but also contain words like "however," "although," "contrary," "refute," or "challenge." if your thesis says "coffee is good" and a note says "however coffee destroys sleep," that's a hit.

### linked mentions
reads obsidian's internal link graph to surface notes connected to relevant hits. if note a contradicts your thesis and links to note b, note b probably has something to add too.

### semantic similarity
uses the same hand-rolled tf-idf vector math to rank notes by relevance. if a note is mathematically similar but contains contradiction cues, it gets flagged and ranked higher.

the whole thing runs locally, offline, and instantly. no api keys. no servers. no waiting for a model to hallucinate a response.

## installation

since this isn't in the official obsidian community plugin store yet, you'll have to do the manual dance:

1. clone this repo into your obsidian vault's plugins folder:
```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/xapqrt/debate-partner-.git debate-partner
```

2. install dependencies and build:
```bash
cd debate-partner
npm install
npm run build
```

3. reload obsidian (cmd/ctrl + r) or enable the plugin from settings → community plugins

4. look for the swords icon in your ribbon. click it. embrace the chaos.

## usage

1. highlight any text in a note (this is your "thesis")
2. click the swords icon or run the "Challenge My Thinking" command
3. the plugin scans your vault and opens a sidebar with contradicting notes
4. each result shows:
   - the note title (clickable, opens the note)
   - relevance score (how related is it to your thesis)
   - contradiction score (how much it argues against you)
   - an excerpt from the relevant passage
   - linked mentions to related notes
   - a severity dot (red = high, orange = medium, green = low)

## settings

head to settings → debate partner to tweak:

- **context count**: how many contradictory notes to surface (1–15, default 5)

## troubleshooting

**"nothing happens when i click the swords icon"**
- make sure you actually highlighted text first. the plugin can't argue with thin air.
- check the console (cmd/ctrl + shift + i) for red error text

**"the sidebar is empty"**
- either your thesis is flawless (doubt it) or none of your notes contain enough contradiction markers
- try highlighting a more controversial claim

**"it only shows irrelevant notes"**
- your vault might not have enough content for tf-idf to work well. the more notes you have, the better the math gets.

