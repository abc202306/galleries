
# README

![](/docs/image-file/obsidian-vault-galleries-graph-view-image.png)

> [!Note]
> 1. [[#Web Clipper]]
> 2. [[#Folder Struct]]
> 3. [[#Views of gallery-base.base]]
> 4. [[#Script]]

## Web Clipper

- EXHentai Web Clipper for Obsidian | https://github.com/abc202306/exhentai-web-clipper-for-obsidian
- NHentai Web Clipper for Obsidian | https://github.com/abc202306/nhentai-web-clipper-for-obsidian

## Folder Struct

| Folder Path | DFC |
| :--- | ---: |
| [[docs]] | 33 |
| [[docs]]/[[base-file]] | 2 |
| [[docs]]/[[canvas]] | 1 |
| [[docs]]/[[galleries]] | 2 |
| [[docs]]/[[image-file]] | 1 |
| [[docs]]/[[notation]] | 1 |
| [[docs]]/[[tag]] | 14 |
| [[galleries]] | 1358 |
| [[galleries]]/[[exhentai]] | 552 |
| [[galleries]]/[[nhentai]] | 806 |
| [[notes]] | 7 |
| [[tag]] | 1588 |
| [[tag]]/[[artist]] | 531 |
| [[tag]]/[[categories]] | 10 |
| [[tag]]/[[character]] | 268 |
| [[tag]]/[[cosplayer]] | 1 |
| [[tag]]/[[female]] | 199 |
| [[tag]]/[[group-ns]] | 243 |
| [[tag]]/[[language]] | 9 |
| [[tag]]/[[location]] | 4 |
| [[tag]]/[[male]] | 104 |
| [[tag]]/[[mixed]] | 7 |
| [[tag]]/[[other]] | 107 |
| [[tag]]/[[parody]] | 104 |
| [[tag]]/[[temp]] | 1 |
| [[templates]] | 1 |
| [[uploader]] | 157 |

## Views of [[gallery-base.base]]

> [!Note]
> 
> 1. [[#gallery-base.base artist artist|artist]]
> 2. [[#gallery-base.base categories categories|categories]]
> 3. [[#gallery-base.base parody parody|parody]]
> 4. [[#female|female]]
> 5. [[#male|male]]
> 6. [[#mixed|mixed]]
> 7. [[#character|character]]

### [[gallery-base.base#artist|artist]]

1. [[gallery-base.base#artist/kiira|kiira]] | 5 | [[kiira]]
2. [[gallery-base.base#artist/henreader|henreader]] | 5 | [[henreader]]
3. [[gallery-base.base#artist/utatane|utatane]] | 4 | [[utatane]]
4. [[gallery-base.base#artist/wancho|wancho]] | 5 | [[wancho]]
5. [[gallery-base.base#artist/custom-udon|custom-udon]] | 3 | [[custom-udon]]
6. [[gallery-base.base#artist/komugi|komugi]] | 3 | [[komugi]]
7. [[gallery-base.base#artist/hikami-izuto|hikami-izuto]] | 2 | [[hikami-izuto]]
8. [[gallery-base.base#artist/murai-renji|murai-renji]] | 1 | [[murai-renji]]
9. [[gallery-base.base#artist/yoyomax|yoyomax]] | 1 | [[yoyomax]]
10. [[gallery-base.base#artist/kani-biimu|kani-biimu]] | 1 | [[kani-biimu]]
11. [[gallery-base.base#artist/baku-p|baku-p]] | 1 | [[baku-p]]

### [[gallery-base.base#categories|categories]]

1. [[gallery-base.base#categories/doujinshi|doujinshi]] | 446 | [[doujinshi]]
2. [[gallery-base.base#categories/manga|manga]] | 110 | [[manga]]
3. [[gallery-base.base#categories/image-set|image-set]] | 26 | [[image-set]]
4. [[gallery-base.base#categories/misc|misc]] | 23 | [[misc]]
5. [[gallery-base.base#categories/artist-cg|artist-cg]] | 13 | [[artist-cg]]
6. [[gallery-base.base#categories/game-cg|game-cg]] | 8 | [[game-cg]]
7. [[gallery-base.base#categories/non-h|non-h]] | 3 | [[non-h]]
8. [[gallery-base.base#categories/western|western]] | 1 | [[western]]

### [[gallery-base.base#parody|parody]]

1. [[gallery-base.base#parody/original|original]] | 182 | [[original]]
2. [[gallery-base.base#parody/blue-archive|blue-archive]] | 89 | [[blue-archive]]
3. [[gallery-base.base#parody/touhou-project|touhou-project]] | 25 | [[touhou-project]]
4. [[gallery-base.base#parody/mahoujin-guru-guru|mahoujin-guru-guru]] | 20 | [[mahoujin-guru-guru]]

### female

1. [[gallery-base.base#female/lolicon|lolicon]] | 598 | [[lolicon]]
2. [[gallery-base.base#female/rape|rape]] | 98 | [[rape]]

### male

1. [[gallery-base.base#male/sole-male|sole-male]] | 279 | [[sole-male]]

### mixed

1. [[gallery-base.base#mixed/kodomo-doushi|kodomo-doushi]] | 26 | [[kodomo-doushi]]

### character

1. [[gallery-base.base#character/kukuri|kukuri]] | 19 | [[kukuri]]

## Script

> [!Note]
> 1. [[#Init Empty File as Saved Query Note for Gallery Dynamic Base View and Generate File Content of Related Tag Group Note]]
> 1. [[#Log Folder Statics]]
> 1. [[#Remove Duplicate Value in Each Array Property in Front Matter for All Markdown Files]]

### Init Empty File as Saved Query Note for Gallery Dynamic Base View and Generate File Content of Related Tag Group Note

```js
function getLocalISOStringWithTimezone() {
  const date = new Date();
  const pad = n => String(n).padStart(2, "0");

  const offset = -date.getTimezoneOffset(); // actual UTC offset in minutes
  const sign = offset >= 0 ? "+" : "-";
  const hours = pad(Math.floor(Math.abs(offset) / 60));
  const minutes = pad(Math.abs(offset) % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${hours}:${minutes}`;
}

function getTagFileContent(title, ctime, mtime) {
	const f = app.metadataCache.getFirstLinkpathDest(title);
	const paths = [...app.metadataCache.getBacklinksForFile(f).data.keys()];
	const ngls = paths.filter(i=>!i.startsWith("galleries/")).sort();
	const gls = paths.filter(i=>i.startsWith("galleries/")).sort();
	const ngstr = "> seealso: "+ngls.map(i=>"[["+app.metadataCache.fileToLinktext(app.vault.getAbstractFileByPath(i))+"]]").join(", ");
	const gstr = gls.map(path=>{
		const f2 = app.vault.getAbstractFileByPath(path);
		const linktext2 = app.metadataCache.fileToLinktext(f2);
		const fc2 = app.metadataCache.getFileCache(f2);
		const display2 = fc2?.frontmatter?.japanese || fc2?.frontmatter?.english || linktext2;
		const link2 = display2 === linktext2 ? ("[["+linktext2+"]]") : ("[["+linktext2+"|"+display2+" ]]");
		const res = /^\[\[(?<linktext3>[^\|]*)\|?.*\]\]$/.exec(fc2?.frontmatter?.cover);
		const coverEmbed = res ? ("\n\t- "+"![["+res.groups.linktext3+"|200]]"):"";
		
		return "1. "+link2+coverEmbed;
	}).join("\n");
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# ${title}

${ngstr}

![[gallery-dynamic-base.base]]

${gstr}
`
}

function removeWikiLinkMark(str){
	return str.replace(/^\[\[/,"").replace(/\]\]$/,"");
}

function getTagGroupMOC(title) {
	const property = title.replace(/-ns$/,"");
	return app.vault.getMarkdownFiles()
		.filter(f=>f.path.startsWith("galleries/"))
		.flatMap(f=>(app.metadataCache.getFileCache(f)?.frontmatter||new Object())[property])
		.unique()
		.filter(v=>v)
		.sort((a,b)=>removeWikiLinkMark(a).localeCompare(removeWikiLinkMark(b)))
		.map(v=>"1. "+v)
		.join("\n");
}

function getTagGroupFileContent(title, ctime, mtime) {
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# ${title}

> seealso: [[tag]]

${getTagGroupMOC(title)}
`
}

app.vault.getMarkdownFiles()
	.filter(f=>["tag/", "uploader/"].some(rootDirPath=>f.path.startsWith(rootDirPath)))
	.forEach(f=>app.vault.process(f, data=>{
		const title = f.basename;
		const mtime = getLocalISOStringWithTimezone();
		const ctime = app.metadataCache.getFileCache(f)?.frontmatter?.mtime || mtime;

		const newData = getTagFileContent(title, ctime, mtime);
		if (newData.split("\n").length!==data.split("\n").length){
			return newData;
		} else {
			return data;
		}
	}));

app.vault.getMarkdownFiles()
	.filter(f=>f.path.startsWith("docs/tag/"))
	.forEach(f=>app.vault.process(f, data=>{
		const title = f.basename;
	    const mtime = getLocalISOStringWithTimezone();
		const ctime = app.metadataCache.getFileCache(f)?.frontmatter?.mtime || mtime;
		
		const newData = getTagGroupFileContent(title, ctime, mtime);
		if (newData.split("\n").length!==data.split("\n").length){
			return newData;
		} else {
			return data;
		}
	}))

```

### Log Folder Statics

```js
const files = app.vault.getFiles();
const folders = app.vault.getAllFolders().sort((a,b)=>a.path.localeCompare(b.path));
function getRenderedFolderPath(folder){
	return folder.path.split("/").map(part=>"[["+part+"]]").join("/")
}
function getDecendantFilesCount(folder,files){
	return files.filter(f=>f.path.startsWith(folder.path+"/")).length;
}
const tableStr = `| Folder Path | DFC |
| :--- | ---: |
${
folders.map(folder=>
	`| ${getRenderedFolderPath(folder)} | ${getDecendantFilesCount(folder,files)} |`
).join("\n")
}`;

console.log(tableStr)
```

### Remove Duplicate Value in Each Array Property in Front Matter for All Markdown Files

```js
app.vault.getMarkdownFiles().forEach(f=>{
    const fc = app.metadataCache.getFileCache(f);
    if (!fc.frontmatter){
        return;
    }
    for (let k in fc.frontmatter){
        const v1 = fc.frontmatter[k];
        if (!Array.isArray(v1)){
            continue;
        }
        const v2 = v1.unique();
        if (v2.length === v1.length){
            continue;
        }
        app.fileManager.processFrontMatter(f,fm=>{
            fm[k] = v2;
        })
    }
})
```
