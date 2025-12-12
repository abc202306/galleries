
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

1. [[notes]] | 7
2. [[docs]] | 29
	1. [[gallery|galleries]] | 2
	2. [[tag]] | 12
	3. [[keyword]] | 11
	4. [[base-file]] | 2
	5. [[image-file]] | 1
	6. [[notation]] | 1
3. [[gallery|galleries]] | 1260
	1. [[exhentai]] | 454
	2. [[nhentai]] | 806
4. [[tag]] | 1524
	1. [[artist]] | 513
	2. [[category]] | 8
	3. [[character]] | 251
	4. [[female]] | 192
	5. [[group-ns]] | 235
	6. [[language]] | 9
	7. [[location]] | 3
	8. [[male]] | 103
	9. [[mixed]] | 7
	10. [[other]] | 106
	11. [[parody]] | 96
	12. [[temp]] | 1
5. [[templates]] | 1
6. [[uploader]] | 136

## Views of [[gallery-base.base]]

> [!Info]
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

### Init Empty File as Saved Query Note for Gallery Dynamic Base View

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

function getFileContent(title, time) {
    return `---
ctime: ${time}
mtime: ${time}
---

# ${title}

![[gallery-dynamic-base.base]]
`
}

app.vault.getMarkdownFiles()
  .filter(f=>["tag/", "uploader/"].some(rootDirPath=>f.path.startsWith(rootDirPath)))
  .filter(f=>app.metadataCache.getFileCache(f).frontmatter===undefined)
  .forEach(f=>app.vault.process(f, _data=>{
    const title = f.basename;
    const time = getLocalISOStringWithTimezone();
    return getFileContent(title, time);
  }));
  
```
