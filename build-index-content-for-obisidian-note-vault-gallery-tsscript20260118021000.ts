//
// ## 1 command-ts-to-js-file:
//
// description: Compile TypeScript to JavaScript and remove the `Object.defineProperty(exports, "__esModule", { value: true });` line added by tsc.
//

interface TypeDictConfig {
    rewrite: string[]
}

// Obsidian API types (assuming global app variable from plugin context)
declare const app: any

// Helper function for RegExp escaping (alternative to RegExp.escape)
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

class FolderConfig {
    // all folder type is type/rewrite
    tag: string = 'gallery-tag/'
    gallery: string = 'galleries/'
    property: string = 'gallery-doc-property/'
    uploader: string = 'exhentai-uploader/'
    docsTag: string = 'gallery-doc/gallery-doc-gallery-tag/'
    docsYear: string = 'gallery-doc/gallery-doc-year/'

    static readonly _typeDict: TypeDictConfig = {
        rewrite: ['tag', 'gallery', 'property', 'uploader', 'docsTag', 'docsYear']
    }
}

interface FileTypeDict {
    replace: string[]
    rewrite: string[]
}

class FileConfig {
    readme: string = 'README.md' // type/replace
    tag: string = 'gallery-doc/gallery-doc/gallery-doc-gallery-tag.md' // type/rewrite
    uploader: string = 'gallery-doc/gallery-doc/gallery-doc-exhentai-uploader.md' // type/rewrite
    galleryNotes: string = 'gallery-doc/collection/collection-gallery-notes.md' // type/replace
    gallery: string = 'gallery-doc/collection/collection-gallery-items.md' // type/replace
    exhentai: string = 'gallery-doc/gallery-doc-galleries/gallery-url-exhentai.md' // type/replace
    nhentai: string = 'gallery-doc/gallery-doc-galleries/gallery-url-nhentai.md' // type/replace

    static readonly _typeDict: FileTypeDict = {
        replace: ['readme', 'galleryNotes', 'gallery', 'exhentai', 'nhentai'],
        rewrite: ['tag', 'uploader']
    }
}

class RefConfig {
    // docs
    docsMeta: string = '[[gallery-doc|gallery-doc]]'
    docsTag: string = '[[gallery-doc-gallery-tag|gallery-doc-gallery-tag]]'
    docsCollection: string = '[[collection|collection]]'
    docs: string = '[[gallery-doc|gallery-doc]]'

    // base
    baseGalleryDynamic: string =
        '[[base-gallery-dynamic.base|base-gallery-dynamic.base]]'
    basePropertyDynamic: string =
        '[[base-property-dynamic.base|base-property-dynamic.base]]'
    baseGallery: string = '[[base-gallery.base|base-gallery.base]]'

    // galleryTagGroup
    galleryTagGroupArtist: string = '[[exhentai-tg-artist|artist]]'
    galleryTagGroupCategories: string = '[[exhentai-tg-categories|categories]]'
    galleryTagGroupCharacter: string = '[[exhentai-tg-character|character]]'
    galleryTagGroupCosplayer: string = '[[exhentai-tg-cosplayer|cosplayer]]'
    galleryTagGroupFemale: string = '[[exhentai-tg-female|female]]'
    galleryTagGroupGroup: string = '[[exhentai-tg-group|group]]'
    galleryTagGroupKeywords: string = '[[nhentai-tg-keywords|keywords]]'
    galleryTagGroupLanguage: string = '[[exhentai-tg-language|language]]'
    galleryTagGroupLocation: string = '[[exhentai-tg-location|location]]'
    galleryTagGroupMale: string = '[[exhentai-tg-male|male]]'
    galleryTagGroupMixed: string = '[[exhentai-tg-mixed|mixed]]'
    galleryTagGroupOther: string = '[[exhentai-tg-other|other]]'
    galleryTagGroupParody: string = '[[exhentai-tg-parody|parody]]'
    galleryTagGroupTemp: string = '[[exhentai-tg-temp|temp]]'

    // collection
    collectionGallery: string =
        '[[collection-gallery-items|collection-gallery-items]]'
    collectionGalleryNotes: string =
        '[[collection-gallery-notes|collection-gallery-notes]]'
}

class KeywordsConfig {
    exhentai: string = 'exhentai'
    nhentai: string = 'nhentai'
    galleryItems: string = '[[gallery-items|gallery-items]]'
    noteList: string = 'note-list'
}

class PropertyConfig {
    propertyNames: string[] = [
        'artist',
        'group',
        'categories',
        'character',
        'parody',
        'language',
        'cosplayer',
        'female',
        'location',
        'male',
        'mixed',
        'other',
        'temp',
        'keywords',
        'uploader'
    ]
}

class Config {
    pathFolder: FolderConfig = new FolderConfig()
    pathFile: FileConfig = new FileConfig()
    ref: RefConfig = new RefConfig()
    keywords: KeywordsConfig = new KeywordsConfig()
    property: PropertyConfig = new PropertyConfig()
}

const config = new Config()

class DateUtil {
    private static readonly _singleInstance: DateUtil = new DateUtil()

    static getSingleInstance(): DateUtil {
        return DateUtil._singleInstance
    }

    getLocalISOStringWithTimezone(): string {
        const date = new Date()
        const pad = (n: number): string => String(n).padStart(2, '0')

        const offset = -date.getTimezoneOffset()
        const sign = offset >= 0 ? '+' : '-'
        const hours = pad(Math.floor(Math.abs(offset) / 60))
        const minutes = pad(Math.abs(offset) % 60)

        return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
                date.getDate()
            )}T` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
                date.getSeconds()
            )}` +
            `${sign}${hours}:${minutes}`
        )
    }
}

class ArrayUtil {
    private static readonly _singleInstance: ArrayUtil = new ArrayUtil()

    static getSingleInstance(): ArrayUtil {
        return ArrayUtil._singleInstance
    }

    // Utility helpers to avoid relying on environment-specific prototype extensions
    uniqueArray<T>(arr: T[]): T[] {
        return Array.from(new Set(arr))
    }

    groupBy<T, K>(array: T[], keyFn: (item: T) => K): Array<[K, T[]]> {
        const map = new Map<K, T[]>()
        for (const item of array) {
            const key = keyFn(item)
            const list = map.get(key) || []
            list.push(item)
            map.set(key, list)
        }
        return Array.from(map.entries())
    }

    safeArray<T>(v: T | T[] | undefined | null): T[] {
        if (!v) return []
        return Array.isArray(v) ? v : [v]
    }
}

class PathUtil {
    private static readonly _singleInstance: PathUtil = new PathUtil()

    static getSingleInstance(): PathUtil {
        return PathUtil._singleInstance
    }

    compareGalleryPathWithPropertyUploaded(path1: string, path2: string): number {
        const f1 = app.vault.getAbstractFileByPath(path1)
        const f2 = app.vault.getAbstractFileByPath(path2)
        const fc1 = app.metadataCache.getFileCache(f1)
        const fc2 = app.metadataCache.getFileCache(f2)
        const v1 = String(fc1?.frontmatter?.uploaded || '_')
        const v2 = String(fc2?.frontmatter?.uploaded || '_')
        // sort descending
        const result = v2.localeCompare(v1)
        if (result !== 0) {
            return result
        }
        return path2.localeCompare(path1)
    }

    getGalleryPathRepresentationStr(path: string): string {
        const f2 = app.vault.getAbstractFileByPath(path)
        const linktext2 = app.metadataCache.fileToLinktext(f2)
        const fc2 = app.metadataCache.getFileCache(f2) || {}

        const postDescription = ''

        const display2 =
            (fc2.frontmatter?.japanese as string | undefined) ||
            (fc2.frontmatter?.english as string | undefined) ||
            linktext2
        const link2 =
            display2 === linktext2
                ? `| [[${linktext2}|${linktext2}]]`
                : `\u001C${display2}\u001C | [[${linktext2}|${linktext2}]]`.replace(
                    /\u001C/g,
                    '`'
                )

        const coverField = fc2.frontmatter?.cover as string | undefined
        let coverEmbed = ''
        if (coverField) {
            const res = /^\[\[(?<linktext3>[^\|]*)\|?.*\]\]$/.exec(coverField)
            coverEmbed = res
                ? `\n\t- ![[${res.groups!.linktext3}|200]]`
                : `\n\t- ![200](${coverField})`
        }

        return `1. ${link2}${postDescription}${coverEmbed}`
    }

    getNGStr(nonGalleryNotePaths: Set<string>): string {
        const ngls = [...nonGalleryNotePaths].sort()
        return ngls
            .map(
                path =>
                    `[[${app.metadataCache.fileToLinktext(
                        app.vault.getAbstractFileByPath(path)
                    )}|${app.metadataCache.fileToLinktext(
                        app.vault.getAbstractFileByPath(path)
                    )}]]`
            )
            .join(', ')
    }

    getGStrASList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.compareGalleryPathWithPropertyUploaded.bind(this)
        )
        return gls.map(p => this.getGalleryPathRepresentationStr(p)).join('\n')
    }

    getGStrASGroupedList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.compareGalleryPathWithPropertyUploaded.bind(this)
        )
        const groupedByYear = arrayUtil.groupBy(gls, gnPath =>
            stringUtil.getYear(app.vault.getAbstractFileByPath(gnPath))
        )
        const parts: string[] = groupedByYear
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([yearKey, yearGroup]) => {
                const groupedByMonth = arrayUtil.groupBy(yearGroup, gnPath =>
                    stringUtil.getMonth(app.vault.getAbstractFileByPath(gnPath))
                )
                const yearSectionContentParts: string[] = groupedByMonth
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .flatMap(([monthKey, monthGroup]) => {
                        const groupedByDay = arrayUtil.groupBy(monthGroup, gnPath =>
                            stringUtil.getDay(app.vault.getAbstractFileByPath(gnPath))
                        )
                        const daySectionContentParts: string[] = groupedByDay
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .flatMap(([dayKey, dayGroup]): string[] => [
                                `##### ${dayKey}`,
                                dayGroup
                                    .map(p => this.getGalleryPathRepresentationStr(p))
                                    .join('\n')
                            ])
                        return [`#### ${monthKey}`, ...daySectionContentParts] as string[]
                    })
                return [`### ${yearKey}`, ...yearSectionContentParts] as string[]
            })
        return parts.join('\n\n')
    }

    getGStr(galleryNotePaths: Set<string>): string {
        return this.getGStrASGroupedList(galleryNotePaths)
    }
}

class FileTemplateUtil {
    private static readonly _singleInstance: FileTemplateUtil =
        new FileTemplateUtil()

    static getSingleInstance(): FileTemplateUtil {
        return FileTemplateUtil._singleInstance
    }

    getTagFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        const f = app.metadataCache.getFirstLinkpathDest(title)
        const backlinks = app.metadataCache.getBacklinksForFile(f)?.data
        const paths = backlinks ? [...backlinks.keys()] : []

        const ngstr = pathUtil.getNGStr(
            new Set(
                paths
                    .filter(i => !i.startsWith(config.pathFolder.gallery))
                    .filter(i => i !== config.pathFile.readme)
            )
        )
        const gstr = pathUtil.getGStr(
            new Set(paths.filter(i => i.startsWith(config.pathFolder.gallery)))
        )

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n> seealso: ${ngstr}\n\n!${config.ref.baseGalleryDynamic}\n\n## ${config.keywords.galleryItems}\n\n${gstr}\n`
    }

    getYearFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        const f = app.metadataCache.getFirstLinkpathDest(title)
        const backlinks = app.metadataCache.getBacklinksForFile(f)?.data
        const paths = backlinks ? [...backlinks.keys()] : []

        const ngstr = pathUtil.getNGStr(
            new Set(
                paths
                    .filter(i => !i.startsWith(config.pathFolder.gallery))
                    .filter(i => i !== config.pathFile.readme)
            )
        )

        const year = title.replace(/^gallery-year-/, '')

        const galleryNotePaths = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
            .filter((f: any) => stringUtil.getYear(f) === year)
            .map((f: any) => f.path)
        const gstr = pathUtil.getGStr(new Set(galleryNotePaths))

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n> seealso: ${ngstr}\n\n## ${config.keywords.galleryItems}\n\n${gstr}\n`
    }

    getGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        seealso: string
    ): string {
        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n> seealso: ${seealso}\n\n${this._getTagGroupMOC(
            title
        )}\n`
    }

    getTagMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        const {
            docs,
            galleryTagGroupArtist,
            galleryTagGroupCategories,
            galleryTagGroupCharacter,
            galleryTagGroupCosplayer,
            galleryTagGroupFemale,
            galleryTagGroupGroup,
            galleryTagGroupKeywords,
            galleryTagGroupLanguage,
            galleryTagGroupLocation,
            galleryTagGroupMale,
            galleryTagGroupMixed,
            galleryTagGroupOther,
            galleryTagGroupParody,
            galleryTagGroupTemp
        } = config.ref

        const ol = [
            galleryTagGroupArtist,
            galleryTagGroupCategories,
            galleryTagGroupCharacter,
            galleryTagGroupCosplayer,
            galleryTagGroupFemale,
            galleryTagGroupGroup,
            galleryTagGroupKeywords,
            galleryTagGroupLanguage,
            galleryTagGroupLocation,
            galleryTagGroupMale,
            galleryTagGroupMixed,
            galleryTagGroupOther,
            galleryTagGroupParody,
            galleryTagGroupTemp
        ]
            .map(value => `1. ${value} | ${stringUtil.getTagCount(value)}\n`)
            .join('')

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# tag\n\n> seealso: ${docs}\n\n${ol}`
    }

    getTagGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        return this.getGroupFileContent(title, ctime, mtime, config.ref.docsTag)
    }

    getUploaderGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        return this.getGroupFileContent(title, ctime, mtime, config.ref.docsMeta)
    }

    getPropertyFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        const f = app.metadataCache.getFirstLinkpathDest(title)
        const backlinks = app.metadataCache.getBacklinksForFile(f)?.data
        const paths = backlinks ? [...backlinks.keys()] : []

        const ngstr = pathUtil.getNGStr(
            new Set(
                paths
                    .filter(i => !i.startsWith(config.pathFolder.gallery))
                    .filter(i => i !== config.pathFile.readme)
            )
        )

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n> seealso: ${ngstr}\n\n!${config.ref.basePropertyDynamic}\n`
    }

    async getReadmeFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): Promise<string> {
        const file = app.vault.getAbstractFileByPath(config.pathFile.readme)
        const fileContent = await app.vault.read(file)

        const files = app.vault.getFiles()
        const folders = app.vault
            .getAllFolders()
            .sort((a: any, b: any) => a.path.localeCompare(b.path))

        const tableStr = `| Folder Path | DFC | DFMC | DFOC |\n| :--- | ---: | ---: | ---: |\n${folders
            .map(
                (folder: any) =>
                    `| ${stringUtil.getRenderedFolderPath(
                        folder
                    )} | ${stringUtil.getDecendantFilesCount(
                        folder,
                        files,
                        /.*/
                    )} | ${stringUtil.getDecendantFilesCount(
                        folder,
                        files,
                        /^md$/
                    )} | ${stringUtil.getDecendantFilesCount(
                        folder,
                        files,
                        /^(?!md$)/
                    )} |`
            )
            .join('\n')}`

        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime)
            .replace(
                /(?<=\n)## Folder Struct\n[^#]*(?=\n##\s)/,
                '## Folder Struct\n\n> DFC stands for the total number of descendant files\n\n' +
                tableStr +
                '\n'
            )

        return newData
    }

    async getNoteMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): Promise<string> {
        const metaFilePath = config.pathFile.galleryNotes
        const noteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.ref.collectionGalleryNotes)
            )

        const file = app.vault.getAbstractFileByPath(metaFilePath)
        const fileContent = await app.vault.read(file)

        const gls = noteFiles
            .sort((f1: any, f2: any) => {
                const fc1 = app.metadataCache.getFileCache(f1) || {}
                const fc2 = app.metadataCache.getFileCache(f2) || {}
                const v1 = fc1.frontmatter?.ctime || '_'
                const v2 = fc2.frontmatter?.ctime || '_'
                return v2.localeCompare(v1)
            })
            .map((f: any) => f.path)

        const gstr = gls
            .map((p: string) => pathUtil.getGalleryPathRepresentationStr(p))
            .join('\n')

        const preFMBlock = `\nup:\n  - "${config.ref.docsCollection}"`
        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime, preFMBlock)
            .replace(
                new RegExp(`(?<=\n)## ${escapeRegExp(config.keywords.noteList)}\n[^]*`),
                `## ${config.keywords.noteList}\n\n${gstr}\n`
            )

        return newData
    }

    async getSpecGalleryMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): Promise<string> {
        const metaFilePath = config.pathFile.gallery
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.ref.collectionGallery)
            )
        const preFMBlock = `\nup:\n  - "${config.ref.docsCollection}"\nbases:\n  - "${config.ref.baseGallery}"`
        return await fileTemplateUtil._getGalleryMetaFileContentWithSpecPath(
            _title,
            ctime,
            mtime,
            metaFilePath,
            galleryNoteFiles,
            preFMBlock
        )
    }

    async getSpecEXHentaiGalleryMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): Promise<string> {
        const metaFilePath = config.pathFile.exhentai
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.ref.collectionGallery)
            )
            .filter((f: any) =>
                (app.metadataCache.getFileCache(f)?.frontmatter?.url || '').includes(
                    config.keywords.exhentai
                )
            )
        return await this._getGalleryMetaFileContentWithSpecPath(
            _title,
            ctime,
            mtime,
            metaFilePath,
            galleryNoteFiles
        )
    }

    async getSpecNHentaiGalleryMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): Promise<string> {
        const metaFilePath = config.pathFile.nhentai
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.ref.collectionGallery)
            )
            .filter((f: any) =>
                (app.metadataCache.getFileCache(f)?.frontmatter?.url || '').includes(
                    config.keywords.nhentai
                )
            )
        return await this._getGalleryMetaFileContentWithSpecPath(
            _title,
            ctime,
            mtime,
            metaFilePath,
            galleryNoteFiles
        )
    }

    private _getTagGroupMOC(title: string): string {
        const property = title.replace(/^(gallery-doc-)?((ex|n)hentai-)?(tg-)?/, '')
        const galleryMDFileCaches = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
            .map((f: any) => app.metadataCache.getFileCache(f) || {})

        const allValues = galleryMDFileCaches.flatMap((fc: any) =>
            arrayUtil.safeArray((fc.frontmatter || {})[property])
        )
        const uniqueValues = arrayUtil.uniqueArray(allValues).filter((v: any) => v)

        return uniqueValues
            .sort((a: any, b: any) =>
                stringUtil.toFileName(a).localeCompare(stringUtil.toFileName(b))
            )
            .map(
                (v: any) =>
                    `1. ${v} | ${galleryMDFileCaches.filter((fc: any) =>
                        arrayUtil.safeArray((fc.frontmatter || {})[property]).includes(v)
                    ).length
                    }`
            )
            .join('\n')
    }

    async _getGalleryMetaFileContentWithSpecPath(
        _title: string,
        ctime: string,
        mtime: string,
        metaFilePath: string,
        galleryNoteFiles: any[],
        preFMBlock: string = ''
    ): Promise<string> {
        const file = app.vault.getAbstractFileByPath(metaFilePath)
        const fileContent = await app.vault.read(file)

        const gstr = pathUtil.getGStr(new Set(galleryNoteFiles.map(f => f.path)))

        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime, preFMBlock)
            .replace(
                new RegExp(
                    `(?<=\n)## ${escapeRegExp(config.keywords.galleryItems)}\n[^]*`
                ),
                `## ${config.keywords.galleryItems}\n\n${gstr}\n`
            )

        return newData
    }
}

class StringUtil {
    private static readonly _singleInstance: StringUtil = new StringUtil()

    static getSingleInstance(): StringUtil {
        return StringUtil._singleInstance
    }

    toFileName(wikilinkStr: string): string {
        return (
            /^\[\[(?<fn>[^\|]*?)\|.*?\]\]$/.exec(wikilinkStr)?.groups?.fn ||
            /^\[\[(?<fn>[^\|]*?)\]\]$/.exec(wikilinkStr)?.groups?.fn ||
            '_'
        )
    }

    getTagCount(tagNameSpaceStr: string): number {
        const result01 = /^\[\[(.*)\|(.*)\]\]$/.exec(tagNameSpaceStr)
        const result02 = /^\[\[(.*)\]\]$/.exec(tagNameSpaceStr)
        const str = result01?.[1] || result02?.[1] || tagNameSpaceStr
        const property = str.replace(/^(ex|n)hentai-tg-/, '')
        const galleryMDFileCaches = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
            .map((f: any) => app.metadataCache.getFileCache(f) || {})

        return arrayUtil
            .uniqueArray(
                galleryMDFileCaches.flatMap((fc: any) =>
                    arrayUtil.safeArray((fc.frontmatter || {})[property])
                )
            )
            .filter((v: any) => v).length
    }

    getRenderedFolderPathPart(part: string): string {
        const file01 = app.metadataCache.getFirstLinkpathDest(part)
        if (file01) {
            return `[[${part}\\|${part}]]`
        }
        const file02 =
            app.metadataCache.getFirstLinkpathDest(`gallery-doc-${part}`) ||
            app.metadataCache.getFirstLinkpathDest(`gallery-url-${part}`) ||
            app.metadataCache.getFirstLinkpathDest(`gallery-year-${part}`) ||
            app.metadataCache.getFirstLinkpathDest(`collection-${part}`)
        if (file02) {
            return `[[${file02.basename}\\|${part}]]`
        }
        return `${part}`
    }

    getRenderedFolderPath(folder: any): string {
        return folder.path
            .split('/')
            .map((part: string) => this.getRenderedFolderPathPart(part))
            .join('/')
    }

    getDecendantFilesCount(
        folder: any,
        files: any[],
        extension: RegExp = /.*/
    ): number {
        return files.filter(
            f => f.path.startsWith(folder.path + '/') && extension.exec(f.extension)
        ).length
    }

    replaceFrontMatter(
        fileContent: string,
        ctime: string,
        mtime: string,
        preFMBlock: string = ''
    ): string {
        return (
            `---${preFMBlock}\nctime: ${ctime}\nmtime: ${mtime}\n---\n` +
            fileContent.replace(/^---\r?\n[^]*?(?<=\n)---\r?\n/, '')
        )
    }

    getYear(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, 4) || '1000'
        )
    }

    getMonth(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, 7) || '1000-01'
        )
    }

    getDay(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, 10) || '1000-01-01'
        )
    }
}

class FileProcesserUtil {
    private static readonly _singleInstance: FileProcesserUtil =
        new FileProcesserUtil()

    static getSingleInstance(): FileProcesserUtil {
        return FileProcesserUtil._singleInstance
    }

    async getFileContent(
        file: any,
        data: string,
        getSpecTypeFileContent: (
            title: string,
            ctime: string,
            mtime: string
        ) => Promise<string>
    ): Promise<string> {
        const title = file.basename
        const fileCache = app.metadataCache.getFileCache(file) || {}

        const ctimeInFrontMatter = fileCache.frontmatter?.ctime
        const mtimeInFrontMatter = fileCache.frontmatter?.mtime

        const mtime = dateUtil.getLocalISOStringWithTimezone()
        const ctime = ctimeInFrontMatter || mtime

        const formattedData = data.replace(/\r/g, '')

        const newData1 = await getSpecTypeFileContent(
            title,
            ctimeInFrontMatter,
            mtimeInFrontMatter
        )
        if (formattedData === newData1) return data

        const newData2 = await getSpecTypeFileContent(title, ctime, mtime)
        return newData2
    }

    processFileWith(
        getSpecTypeFileContent: (
            title: string,
            ctime: string,
            mtime: string
        ) => Promise<string>
    ) {
        return async (file: any): Promise<void> => {
            const originalData = await app.vault.read(file)
            const newData = await this.getFileContent(
                file,
                originalData,
                getSpecTypeFileContent
            )
            if (newData !== originalData) {
                await app.vault.process(file, () => newData)
            }
        }
    }

    removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles(): void {
        app.vault.getMarkdownFiles().forEach((f: any) => {
            const fc = app.metadataCache.getFileCache(f) || {}
            if (!fc.frontmatter) return
            for (const k of Object.keys(fc.frontmatter)) {
                const v1 = fc.frontmatter[k]
                if (!Array.isArray(v1)) continue
                const v2 = arrayUtil.uniqueArray(v1)
                if (v2.length === v1.length) continue
                app.fileManager.processFrontMatter(f, (fm: any) => {
                    fm[k] = v2
                })
            }
        })
    }

    createFilesFromUnresolvedLinksForAllGalleryNoteFiles(): void {
        const galleryNoteMDFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
        const unresolvedLinktexts = galleryNoteMDFiles.flatMap((f: any) =>
            Object.keys(app.metadataCache.unresolvedLinks?.[f.path] || {})
        )

        console.log('unresolvedLinktexts', unresolvedLinktexts)

        const galleryMDFileCaches = galleryNoteMDFiles.map(
            (f: any) => app.metadataCache.getFileCache(f) || {}
        )
        for (const linktext of arrayUtil.uniqueArray(unresolvedLinktexts)) {
            const value = `[[${linktext}|${linktext}]]`
            const propertyName = config.property.propertyNames.find(
                pn =>
                    galleryMDFileCaches.filter((fc: any) =>
                        arrayUtil.safeArray((fc.frontmatter || {})[pn]).includes(value)
                    ).length !== 0
            )

            let folderPath = config.pathFolder.tag

            const destPath = folderPath + linktext + '.md'
            try {
                if (!app.vault.getAbstractFileByPath(destPath)) {
                    app.vault
                        .create(destPath, '')
                        .then((f: any) => app.metadataCache.getFileCache(f))
                }
            } catch (e) {
                // ignore creation errors (file may exist already or race conditions)
            }
        }
    }

    getProcessFilePromise(
        path: string,
        getSpecTypeFileContent: (
            title: string,
            ctime: string,
            mtime: string
        ) => Promise<string>
    ): Promise<void> {
        const file = app.vault.getAbstractFileByPath(path)
        const fileProcesser = this.processFileWith(getSpecTypeFileContent)
        return fileProcesser(file)
    }

    batchMoveGalleryNoteFilesByYearUploaded(): void {
        const files = app.vault.getFiles()
        const mdfiles = app.vault.getMarkdownFiles()
        const candidates = mdfiles.filter((f: any) =>
            f.path.startsWith(config.pathFolder.gallery)
        )

        for (const f of candidates) {
            if (f.path.split('/').length !== 3) continue
            const year = stringUtil.getYear(f)
            const folderPath = `${f.parent.path}/${year}`
            if (!app.vault.getFolderByPath(folderPath))
                app.vault.createFolder(folderPath)
        }

        for (const f of candidates) {
            if (f.path.split('/').length !== 3) continue
            const year = app.metadataCache
                .getFileCache(f)
                ?.frontmatter?.uploaded?.slice(0, 4)
            const folderPath = `${f.parent.path}/${year}`
            if (!app.vault.getFolderByPath(folderPath))
                app.vault.createFolder(folderPath)
            const pathPrefix = `${f.parent.path}/${f.basename}`
            files
                .filter((f2: any) => f2.path.startsWith(pathPrefix))
                .forEach((f2: any) => {
                    const newPath2 = `${folderPath}/${f2.name}`
                    app.vault.rename(f2, newPath2)
                    console.log(newPath2)
                })
        }
    }

    standardizeGalleryNoteCoverFileName(): void {
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
        galleryNoteFiles.filter((f: any) => {
            const cover = app.metadataCache.getFileCache(f)?.frontmatter?.cover
            const res = /^\[\[(.*?\|)?(?<basename>.*)\.(?<extension>.*)\]\]$/.exec(
                cover
            )
            if (!res) {
                return
            }
            const coverBasename = res.groups?.basename
            const coverExtension = res.groups?.extension
            const coverLinktext = `${coverBasename}.${coverExtension}`
            const coverFile = app.metadataCache.getFirstLinkpathDest(coverLinktext)
            const newCoverLinktext = `${f.basename}.${coverExtension}`
            const newPath = `${coverFile.parent.path}/${newCoverLinktext}`
            if (!cover?.startsWith('[[' + f.basename)) {
                app.fileManager.renameFile(coverFile, newCoverLinktext)
                console.log(coverFile.name, newPath)
            }
        })
    }

    refreshCache(): void {
        app.vault
            .getMarkdownFiles()
            .forEach((f: any) => app.metadataCache.getFileCache(f))
    }
}

const dateUtil: DateUtil = DateUtil.getSingleInstance()
const arrayUtil: ArrayUtil = ArrayUtil.getSingleInstance()
const pathUtil: PathUtil = PathUtil.getSingleInstance()
const fileTemplateUtil: FileTemplateUtil = FileTemplateUtil.getSingleInstance()
const stringUtil: StringUtil = StringUtil.getSingleInstance()
const fileProcesserUtil: FileProcesserUtil =
    FileProcesserUtil.getSingleInstance()

class Main {
    static main(): void {
        Main.asyncMain().catch(err =>
            console.error('unhandled error in build-index-content main:', err)
        )
    }

    static async processSingleFileSpec(
        path: string,
        fn: (title: string, ctime: string, mtime: string) => Promise<string>
    ): Promise<void> {
        try {
            const timerName = 'timer-' + fn.name + '-' + path
            console.time(timerName)
            console.log('started:', fn.name, path)
            await fileProcesserUtil.getProcessFilePromise(path, fn)
            console.log('ended:', fn.name, path)
            console.timeEnd(timerName)
        } catch (e) {
            console.error('error processing', path, e)
        }
    }

    static async processDirectorySpec(
        rootDirPath: string,
        fn: (title: string, ctime: string, mtime: string) => Promise<string>
    ): Promise<void> {
        try {
            const timerName = 'timer-' + fn.name + '-' + rootDirPath
            console.time(timerName)
            console.log('started:', fn.name, rootDirPath)
            await Promise.all(
                app.vault
                    .getMarkdownFiles()
                    .filter((f: any) => f.path.startsWith(rootDirPath))
                    .map(fileProcesserUtil.processFileWith(fn))
            )
            console.log('ended:', fn.name, rootDirPath)
            console.timeEnd(timerName)
        } catch (e) {
            console.error('error processing dir', rootDirPath, e)
        }
    }

    static clearFrontmatter(): void {
        try {
            const timerName =
                'timer-removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles'
            console.time(timerName)
            console.log(
                'started:',
                fileProcesserUtil
                    .removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles
                    .name
            )
            fileProcesserUtil.removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles()
            console.log(
                'ended:',
                fileProcesserUtil
                    .removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles
                    .name
            )
            console.timeEnd(timerName)
        } catch (e) {
            console.error('error removing duplicates', e)
        }
    }

    static pushTasksWithSingleFileSpec(tasks: Promise<any>[]): void {
        // single-file generators
        const singleFileSpecs: Array<
            [string, (title: string, ctime: string, mtime: string) => Promise<string>]
        > = [
                [
                    config.pathFile.readme,
                    fileTemplateUtil.getReadmeFileContent.bind(fileTemplateUtil)
                ],
                [
                    config.pathFile.uploader,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getUploaderGroupFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFile.tag,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getTagMetaFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFile.galleryNotes,
                    fileTemplateUtil.getNoteMetaFileContent.bind(fileTemplateUtil)
                ],
                [
                    config.pathFile.gallery,
                    fileTemplateUtil.getSpecGalleryMetaFileContent.bind(fileTemplateUtil)
                ],
                [
                    config.pathFile.exhentai,
                    fileTemplateUtil.getSpecEXHentaiGalleryMetaFileContent.bind(
                        fileTemplateUtil
                    )
                ],
                [
                    config.pathFile.nhentai,
                    fileTemplateUtil.getSpecNHentaiGalleryMetaFileContent.bind(
                        fileTemplateUtil
                    )
                ]
            ]

        for (const [path, fn] of singleFileSpecs) {
            tasks.push(Main.processSingleFileSpec(path, fn))
        }
    }

    static pushTasksWithDirectorySpec(tasks: Promise<any>[]): void {
        // directory-scoped generators
        const dirSpecs: Array<
            [string, (title: string, ctime: string, mtime: string) => Promise<string>]
        > = [
                [
                    config.pathFolder.docsTag,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getTagGroupFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFolder.docsYear,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getYearFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFolder.property,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getPropertyFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFolder.uploader,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getTagFileContent(title, ctime, mtime)
                ],
                [
                    config.pathFolder.tag,
                    async (title: string, ctime: string, mtime: string) =>
                        fileTemplateUtil.getTagFileContent(title, ctime, mtime)
                ]
            ]

        for (const [rootDirPath, fn] of dirSpecs) {
            tasks.push(Main.processDirectorySpec(rootDirPath, fn))
        }
    }

    static async asyncMain(): Promise<void> {
        console.time('run_script')
        console.log(`==start (time="${new Date()}")`)

        const tasks: Promise<any>[] = []

        // preparatory runs
        tasks.push(Promise.resolve(fileProcesserUtil.refreshCache()))

        await Promise.all(tasks)

        tasks.length = 0
        tasks.push(
            Promise.resolve(
                fileProcesserUtil.createFilesFromUnresolvedLinksForAllGalleryNoteFiles()
            )
        )
        tasks.push(
            Promise.resolve(
                fileProcesserUtil.batchMoveGalleryNoteFilesByYearUploaded()
            )
        )
        tasks.push(
            Promise.resolve(fileProcesserUtil.standardizeGalleryNoteCoverFileName())
        )

        await Promise.all(tasks)

        tasks.length = 0
        Main.pushTasksWithSingleFileSpec(tasks)

        await Promise.all(tasks)

        tasks.length = 0
        tasks.push(Promise.resolve(fileProcesserUtil.refreshCache()))

        await Promise.all(tasks)

        tasks.length = 0
        Main.pushTasksWithDirectorySpec(tasks)

        tasks.push(Promise.resolve(Main.clearFrontmatter()))

        await Promise.all(tasks)

        console.log(`==end (time="${new Date()}")`)
        console.timeEnd('run_script')
    }
}

Main.main()
