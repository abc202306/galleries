---
ctime: 2025-12-17T20:55:15+08:00
mtime: 2025-12-17T23:32:12+08:00
---

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

> DFC stands for the total number of descendant files

| Folder Path | DFC |
| :--- | ---: |
| [[docs]] | 40 |
| [[docs]]/[[base-file]] | 3 |
| [[docs]]/[[canvas]] | 1 |
| [[docs]]/[[collection]] | 2 |
| [[docs]]/[[galleries]] | 2 |
| [[docs]]/[[image-file]] | 1 |
| [[docs]]/[[notation]] | 1 |
| [[docs]]/[[property]] | 4 |
| [[docs]]/[[tag]] | 14 |
| [[galleries]] | 1364 |
| [[galleries]]/[[exhentai]] | 558 |
| [[galleries]]/[[nhentai]] | 806 |
| [[notes]] | 7 |
| [[property]] | 32 |
| [[property]]/[[basic-property]] | 8 |
| [[property]]/[[docs-property]] | 1 |
| [[property]]/[[gallery-property]] | 22 |
| [[property]]/[[notes-property]] | 1 |
| [[tag]] | 1591 |
| [[tag]]/[[artist]] | 532 |
| [[tag]]/[[categories]] | 10 |
| [[tag]]/[[character]] | 268 |
| [[tag]]/[[cosplayer]] | 1 |
| [[tag]]/[[female]] | 199 |
| [[tag]]/[[group-ns]] | 245 |
| [[tag]]/[[language]] | 9 |
| [[tag]]/[[location]] | 4 |
| [[tag]]/[[male]] | 104 |
| [[tag]]/[[mixed]] | 7 |
| [[tag]]/[[other]] | 107 |
| [[tag]]/[[parody]] | 104 |
| [[tag]]/[[temp]] | 1 |
| [[templates]] | 2 |
| [[uploader]] | 158 |

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

1. [[gallery-base.base#categories/doujinshi|doujinshi]] | 464 | [[doujinshi]]
2. [[gallery-base.base#categories/manga|manga]] | 112 | [[manga]]
3. [[gallery-base.base#categories/image-set|image-set]] | 37 | [[image-set]]
4. [[gallery-base.base#categories/misc|misc]] | 23 | [[misc]]
5. [[gallery-base.base#categories/artist-cg|artist-cg]] | 33 | [[artist-cg]]
6. [[gallery-base.base#categories/game-cg|game-cg]] | 8 | [[game-cg]]
7. [[gallery-base.base#categories/non-h|non-h]] | 4 | [[non-h]]
8. [[gallery-base.base#categories/western|western]] | 1 | [[western]]

### [[gallery-base.base#parody|parody]]

1. [[gallery-base.base#parody/original|original]] | 193 | [[original]]
2. [[gallery-base.base#parody/blue-archive|blue-archive]] | 93 | [[blue-archive]]
3. [[gallery-base.base#parody/touhou-project|touhou-project]] | 25 | [[touhou-project]]
4. [[gallery-base.base#parody/mahoujin-guru-guru|mahoujin-guru-guru]] | 20 | [[mahoujin-guru-guru]]

### female

1. [[gallery-base.base#female/lolicon|lolicon]] | 641 | [[lolicon]]
2. [[gallery-base.base#female/rape|rape]] | 106 | [[rape]]

### male

1. [[gallery-base.base#male/sole-male|sole-male]] | 290 | [[sole-male]]

### mixed

1. [[gallery-base.base#mixed/kodomo-doushi|kodomo-doushi]] | 27 | [[kodomo-doushi]]

### character

1. [[gallery-base.base#character/kukuri|kukuri]] | 19 | [[kukuri]]

## Script

### Create and Update Index Content

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

function compareGalleryPathWithPropertyUploaded(path1, path2) {
    const f1 = app.vault.getAbstractFileByPath(path1);
    const f2 = app.vault.getAbstractFileByPath(path2);
    const fc1 = app.metadataCache.getFileCache(f1);
    const fc2 = app.metadataCache.getFileCache(f2);
    const v1 = fc1?.frontmatter?.uploaded || "_";
    const v2 = fc2?.frontmatter?.uploaded || "_";
    return -v1.localeCompare(v2);
}

function getGalleryPathRepresentationStr(path) {
    const f2 = app.vault.getAbstractFileByPath(path);
    const linktext2 = app.metadataCache.fileToLinktext(f2);
    const fc2 = app.metadataCache.getFileCache(f2);
    const display2 = fc2?.frontmatter?.japanese || fc2?.frontmatter?.english || linktext2;
    const link2 = display2 === linktext2 ? ("[[" + linktext2 + "]]") : ("[[" + linktext2 + "|" + display2 + " ]]");
    const res = /^\[\[(?<linktext3>[^\|]*)\|?.*\]\]$/.exec(fc2?.frontmatter?.cover);
    const coverEmbed = res ? ("\n\t- " + "![[" + res.groups.linktext3 + "|200]]") : "";

    return "1. " + link2 + coverEmbed;
}

function getNGStrAndGStr(title) {
    const f = app.metadataCache.getFirstLinkpathDest(title);
    const paths = [...app.metadataCache.getBacklinksForFile(f).data.keys()];

    const ngls = paths.filter(i => !i.startsWith("galleries/")).filter(i => i !== "README.md").sort();
    const gls = paths.filter(i => i.startsWith("galleries/")).sort(compareGalleryPathWithPropertyUploaded);

    const ngstr = ngls.map(path => "[[" + app.metadataCache.fileToLinktext(app.vault.getAbstractFileByPath(path)) + "]]").join(", ");
    const gstr = gls.map(getGalleryPathRepresentationStr).join("\n");

    return { ngstr, gstr };
}

function getTagFileContent(title, ctime, mtime) {
    const { ngstr, gstr } = getNGStrAndGStr(title);
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# ${title}

> seealso: ${ngstr}

![[gallery-dynamic-base.base]]

${gstr}
`;
}

function removeWikiLinkMark(str) {
    return str.replace(/^\[\[/, "").replace(/\]\]$/, "");
}

function toValueArray(value) {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}

function getTagGroupMOC(title) {
    const property = title.replace(/-ns$/, "");
    const galleryMDFileCaches = app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith("galleries/"))
        .map(f => app.metadataCache.getFileCache(f));
    return galleryMDFileCaches
        .flatMap(fc => (fc?.frontmatter || new Object())[property])
        .unique()
        .filter(v => v)
        .sort((a, b) => removeWikiLinkMark(a).localeCompare(removeWikiLinkMark(b)))
        .map(v => "1. "
            + v
            + " | "
            + galleryMDFileCaches
                .filter(fc => toValueArray((fc?.frontmatter || new Object())[property]).includes(v))
                .length
        )
        .join("\n");
}

function getGroupFileContent(title, ctime, mtime, seealso) {
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# ${title}

> seealso: ${seealso}

${getTagGroupMOC(title)}
`;
}

function getTagCount(tagNameSpaceStr) {
    const property = tagNameSpaceStr.replace(/-ns$/, "");
    const galleryMDFileCaches = app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith("galleries/"))
        .map(f => app.metadataCache.getFileCache(f));
    return galleryMDFileCaches
        .flatMap(fc => (fc?.frontmatter || new Object())[property])
        .unique()
        .filter(v => v)
        .length;
}

function getTagMetaFileContent(_title, ctime, mtime) {
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# tag

> seealso: [[docs]]

1. [[artist]] | ${getTagCount("artist")}
1. [[categories]] | ${getTagCount("categories")}
1. [[character]] | ${getTagCount("character")}
1. [[cosplayer]] | ${getTagCount("cosplayer")}
1. [[female]] | ${getTagCount("female")}
1. [[group-ns]] | ${getTagCount("group-ns")}
1. [[keywords]] | ${getTagCount("keywords")}
1. [[language]] | ${getTagCount("language")}
1. [[location]] | ${getTagCount("location")}
1. [[male]] | ${getTagCount("male")}
1. [[mixed]] | ${getTagCount("mixed")}
1. [[other]] | ${getTagCount("other")}
1. [[parody]] | ${getTagCount("parody")}
1. [[temp]] | ${getTagCount("temp")}
`;
}

function getTagGroupFileContent(title, ctime, mtime) {
    return getGroupFileContent(title, ctime, mtime, "[[tag]]");
}

function getUploaderGroupFileContent(title, ctime, mtime) {
    return getGroupFileContent(title, ctime, mtime, "[[docs]]");
}

function getPropertyFileContent(title, ctime, mtime) {
    const { ngstr, gstr } = getNGStrAndGStr(title);
    return `---
ctime: ${ctime}
mtime: ${mtime}
---

# ${title}

> seealso: ${ngstr}

![[property-dynamic-base.base]]
`;
}

function getRenderedFolderPath(folder) {
    return folder.path.split("/").map(part => "[[" + part + "]]").join("/");
}

function getDecendantFilesCount(folder, files) {
    return files.filter(f => f.path.startsWith(folder.path + "/")).length;
}

async function getReadmeFileContent(_title, ctime, mtime) {
    const file = app.vault.getAbstractFileByPath("README.md");
    const fileContent = await app.vault.read(f);

    const files = app.vault.getFiles();
    const folders = app.vault.getAllFolders().sort((a, b) => a.path.localeCompare(b.path));

    const tableStr = `| Folder Path | DFC |
| :--- | ---: |
${folders.map(folder =>
        `| ${getRenderedFolderPath(folder)} | ${getDecendantFilesCount(folder, files)} |`
    ).join("\n")
        }`;

    const newData = `---
ctime: ${ctime}
mtime: ${mtime}
---
`+ fileContent.replace(/^---\r?\n[^]*?(?<=\n)---\r?\n/, "").replace(/(?<=\n)## Folder Struct\n[^#]*(?=\n##\s)/, "## Folder Struct\n\n" + "> DFC stands for the total number of descendant files\n\n" + tableStr + "\n");

    return newData;
}

async function getFileContent(file, data, getSpecTypeFileContent) {
    const title = file.basename;
    const fileCache = app.metadataCache.getFileCache(file);

    const ctimeInFrontMatter = fileCache?.frontmatter?.ctime;
    const mtimeInFrontMatter = fileCache?.frontmatter?.mtime;

    const mtime = getLocalISOStringWithTimezone();
    const ctime = ctimeInFrontMatter || mtime;

    const formattedData = data.replace(/\r/g, "");

    const newData1 = await getSpecTypeFileContent(title, ctimeInFrontMatter, mtimeInFrontMatter);
    const newData2 = await getSpecTypeFileContent(title, ctime, mtime);

    if (formattedData === newData1) {
        return data;
    }

    return newData2;
}

function processFileWith(getSpecTypeFileContent) {
    async function processFileWrapper(file) {
        const originalData = await app.vault.read(file);
        const newData = await getFileContent(file, originalData, getSpecTypeFileContent);
		
        app.vault.process(file, data => newData);
    }
    return processFileWrapper;
}

function removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles() {
    app.vault.getMarkdownFiles().forEach(f => {
        const fc = app.metadataCache.getFileCache(f);
        if (!fc.frontmatter) {
            return;
        }
        for (let k in fc.frontmatter) {
            const v1 = fc.frontmatter[k];
            if (!Array.isArray(v1)) {
                continue;
            }
            const v2 = v1.unique();
            if (v2.length === v1.length) {
                continue;
            }
            app.fileManager.processFrontMatter(f, fm => {
                fm[k] = v2;
            });
        }
    });
}

function createFilesFromUnresolvedLinksForAllGalleryNoteFiles() {
    const galleryNoteMDFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith("galleries"));
    const unresolvedLinktexts = galleryNoteMDFiles.flatMap(f => Object.keys(app.metadataCache.unresolvedLinks[f.path]));
    

    unresolvedLinktexts.forEach(linktext => {
        app.vault.create("tag/" + linktext + ".md", "");
    });
}

console.time("run_script")

let promiseList = [];

createFilesFromUnresolvedLinksForAllGalleryNoteFiles();

const uploaderFile = app.vault.getAbstractFileByPath("docs/uploader.md");
const uploaderFileProcesser = processFileWith(getUploaderGroupFileContent);

promiseList.push(uploaderFileProcesser(uploaderFile));

const tagMetaFile = app.vault.getAbstractFileByPath("docs/tag.md");
const tagMetaFileProcesser = processFileWith(getTagMetaFileContent);

promiseList.push(tagMetaFileProcesser(tagMetaFile));

const readmeFile = app.vault.getAbstractFileByPath("README.md");
const readmeFileProcesser = processFileWith(getReadmeFileContent);

promiseList.push(readmeFileProcesser(readmeFile));

promiseList = promiseList.concat(app.vault.getMarkdownFiles()
    .filter(f => f.path.startsWith("docs/tag/"))
    .map(processFileWith(getTagGroupFileContent)));

promiseList = promiseList.concat(app.vault.getMarkdownFiles()
    .filter(f => f.path.startsWith("property/"))
    .forEach(processFileWith(getPropertyFileContent)));

promiseList = promiseList.concat(app.vault.getMarkdownFiles()
    .filter(f => ["tag/", "uploader/"].some(rootDirPath => f.path.startsWith(rootDirPath)))
    .forEach(processFileWith(getTagFileContent)));

promiseList.push(removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles());

await Promise.all(promiseList);

console.log("==end")
console.timeEnd("run_script")

```
