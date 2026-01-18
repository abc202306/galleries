

/**
 * Obsidian vault API - assumes global app variable from plugin context
 */
declare const app: any

/**
 * Constants and regular expressions used throughout the script
 */
namespace Constants {
    // Regex patterns
    export const REGEX_WIKILINK_WITH_PIPE = /^\[\[(?<fn>[^\|]*?)\|.*?\]\]$/
    export const REGEX_WIKILINK_WITHOUT_PIPE = /^\[\[(?<fn>[^\|]*?)\]\]$/
    export const REGEX_FRONTMATTER_BLOCK = /^---\r?\n[^]*?(?<=\n)---\r?\n/
    export const REGEX_COVER_WIKILINK = /^\[\[(.*?\|)?(?<basename>.*)\.(?<extension>.*)\]\]$/
    export const REGEX_FRONTMATTER_SECTION = (keyword: string) =>
        new RegExp(`(?<=\n)## ${escapeRegExp(keyword)}\n[^]*`)
    export const REGEX_FRONTMATTER_SECTION_REPLACE = (keyword: string) =>
        new RegExp(`(?<=\n)## ${escapeRegExp(keyword)}\n[^]*?(?=\n##\s)`)

    // Path depth constants
    export const MARKDOWN_FILE_PATH_DEPTH = 3

    // Date format parts
    export const DATE_YEAR_END_INDEX = 4
    export const DATE_MONTH_END_INDEX = 7
    export const DATE_DAY_END_INDEX = 10

    // Logging prefixes
    export const LOG_PREFIX_TIMER = 'timer-'
    export const LOG_PREFIX_STARTED = 'started:'
    export const LOG_PREFIX_ENDED = 'ended:'
    export const LOG_STARTED_SCRIPT = '==start'
    export const LOG_ENDED_SCRIPT = '==end'
}

/**
 * Escapes special characters in a string for use in regular expressions.
 * This is an alternative to RegExp.escape which may not be available in all environments.
 * 
 * @param string - The string to escape
 * @returns The escaped string safe for use in RegExp
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface TypeDictConfig {
    rewrite: string[]
}

interface FileTypeDict {
    replace: string[]
    rewrite: string[]
}

/**
 * Type definitions for Obsidian API
 */
interface VaultFile {
    path: string
    name: string
    basename: string
    extension: string
    parent: VaultFolder
}

interface VaultFolder {
    path: string
}

interface FileCache {
    frontmatter?: Record<string, any>
}

interface BacklinksData {
    data: Map<string, any>
}

/**
 * Type for file content generator functions
 */
type FileContentGenerator = (
    title: string,
    ctime: string,
    mtime: string
) => Promise<string>

/**
 * Configuration for folder paths
 * All folder types follow the pattern: type/rewrite
 */
class FolderConfig {
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

/**
 * Configuration for file paths
 * replace: files that require full content replacement
 * rewrite: files that require selective content rewriting
 */
class FileConfig {
    readme: string = 'README.md'
    tag: string = 'gallery-doc/gallery-doc/gallery-doc-gallery-tag.md'
    uploader: string = 'gallery-doc/gallery-doc/gallery-doc-exhentai-uploader.md'
    galleryNotes: string = 'gallery-doc/collection/collection-gallery-notes.md'
    gallery: string = 'gallery-doc/collection/collection-gallery-items.md'
    exhentai: string = 'gallery-doc/gallery-doc-galleries/gallery-url-exhentai.md'
    nhentai: string = 'gallery-doc/gallery-doc-galleries/gallery-url-nhentai.md'

    static readonly _typeDict: FileTypeDict = {
        replace: ['readme', 'galleryNotes', 'gallery', 'exhentai', 'nhentai'],
        rewrite: ['tag', 'uploader']
    }
}

/**
 * Configuration for wikilink references
 * Includes links to documentation, base templates, and tag groups
 */
class RefConfig {
    // Documentation references
    docsMeta: string = '[[gallery-doc|gallery-doc]]'
    docsTag: string = '[[gallery-doc-gallery-tag|gallery-doc-gallery-tag]]'
    docsCollection: string = '[[collection|collection]]'
    docs: string = '[[gallery-doc|gallery-doc]]'

    // Base template references
    baseGalleryDynamic: string = '[[base-gallery-dynamic.base|base-gallery-dynamic.base]]'
    basePropertyDynamic: string = '[[base-property-dynamic.base|base-property-dynamic.base]]'
    baseGallery: string = '[[base-gallery.base|base-gallery.base]]'

    // Gallery tag group references - organized by tag type
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

    // Collection references
    collectionGallery: string = '[[collection-gallery-items|collection-gallery-items]]'
    collectionGalleryNotes: string = '[[collection-gallery-notes|collection-gallery-notes]]'
}

/**
 * Configuration for keywords used in content
 */
class KeywordsConfig {
    exhentai: string = 'exhentai'
    nhentai: string = 'nhentai'
    galleryItems: string = '[[gallery-items|gallery-items]]'
    noteList: string = 'note-list'
}

/**
 * Configuration for frontmatter property names
 */
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

/**
 * Global application configuration instance
 * Aggregates all configuration objects in a single place
 */
class Config {
    pathFolder: FolderConfig = new FolderConfig()
    pathFile: FileConfig = new FileConfig()
    ref: RefConfig = new RefConfig()
    keywords: KeywordsConfig = new KeywordsConfig()
    property: PropertyConfig = new PropertyConfig()
}

const config = new Config()

/**
 * Utility for date/time operations
 * Provides consistent date formatting across the application
 */
class DateUtil {
    private static readonly _singleInstance: DateUtil = new DateUtil()

    static getSingleInstance(): DateUtil {
        return DateUtil._singleInstance
    }

    /**
     * Returns current date in ISO format with timezone information
     * Example: 2026-01-18T15:30:45+08:00
     * 
     * @returns ISO formatted date string with timezone
     */
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

/**
 * Utility for array operations
 * Provides common array manipulation functions
 */
class ArrayUtil {
    private static readonly _singleInstance: ArrayUtil = new ArrayUtil()

    static getSingleInstance(): ArrayUtil {
        return ArrayUtil._singleInstance
    }

    /**
     * Removes duplicate entries from an array while preserving order
     * 
     * @param arr - Array to deduplicate
     * @returns New array with unique elements only
     */
    uniqueArray<T>(arr: T[]): T[] {
        return Array.from(new Set(arr))
    }

    /**
     * Groups array elements by a key function
     * 
     * @param array - Array to group
     * @param keyFn - Function that determines the grouping key for each element
     * @returns Array of [key, elements] tuples
     */
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

    /**
     * Safely converts a value to an array
     * Handles undefined, null, and already-array values
     * 
     * @param v - Value to convert
     * @returns Array containing the value(s), or empty array if value is falsy
     */
    safeArray<T>(v: T | T[] | undefined | null): T[] {
        if (!v) return []
        return Array.isArray(v) ? v : [v]
    }
}

/**
 * Utility for file path and content operations
 * Handles path comparisons, gallery representations, and nested list generation
 */
class PathUtil {
    private static readonly _singleInstance: PathUtil = new PathUtil()

    static getSingleInstance(): PathUtil {
        return PathUtil._singleInstance
    }

    /**
     * Compares two gallery file paths for sorting
     * Primary sort: by uploaded date (descending), then alphabetically
     * 
     * @param path1 - First file path
     * @param path2 - Second file path
     * @returns Negative if path1 < path2, positive if path1 > path2, 0 if equal
     */
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

    /**
     * Generates a markdown representation string for a gallery file
     * Includes wikilink, Japanese/English title, and optional cover image
     * 
     * @param path - Gallery file path
     * @returns Formatted markdown string for the gallery item
     */
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

    /**
     * Generates comma-separated wikilinks for non-gallery notes
     * 
     * @param nonGalleryNotePaths - Set of non-gallery file paths
     * @returns Formatted wikilink string
     */
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

    /**
     * Generates a simple list of gallery items
     * 
     * @param galleryNotePaths - Set of gallery file paths
     * @returns Formatted markdown list
     */
    getGStrASList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.compareGalleryPathWithPropertyUploaded.bind(this)
        )
        return gls.map(p => this.getGalleryPathRepresentationStr(p)).join('\n')
    }

    /**
     * Generates a hierarchical grouped list of gallery items organized by year/month/day
     * 
     * @param galleryNotePaths - Set of gallery file paths
     * @returns Formatted markdown hierarchical list
     */
    getGStrASGroupedList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.compareGalleryPathWithPropertyUploaded.bind(this)
        )
        const groupedByYear = arrayUtil.groupBy(gls, gnPath =>
            stringUtil.getYear(app.vault.getAbstractFileByPath(gnPath))
        )
        const parts: string[] = groupedByYear
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([yearKey, yearGroup]) => this._buildYearSection(yearKey, yearGroup))
        return parts.join('\n\n')
    }

    /**
     * Builds a year section for grouped lists
     * @private
     */
    private _buildYearSection(yearKey: string, yearGroup: string[]): string[] {
        const groupedByMonth = arrayUtil.groupBy(yearGroup, gnPath =>
            stringUtil.getMonth(app.vault.getAbstractFileByPath(gnPath))
        )
        const yearSectionContentParts: string[] = groupedByMonth
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([monthKey, monthGroup]) => this._buildMonthSection(monthKey, monthGroup))
        return [`### ${yearKey}`, ...yearSectionContentParts] as string[]
    }

    /**
     * Builds a month section for grouped lists
     * @private
     */
    private _buildMonthSection(monthKey: string, monthGroup: string[]): string[] {
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
    }

    /**
     * Generates the final gallery string (delegates to grouping logic)
     * 
     * @param galleryNotePaths - Set of gallery file paths
     * @returns Formatted gallery string
     */
    getGStr(galleryNotePaths: Set<string>): string {
        return this.getGStrASGroupedList(galleryNotePaths)
    }
}

/**
 * Utility for string operations
 * Handles wikilink parsing, file naming, and metadata extraction
 */
class StringUtil {
    private static readonly _singleInstance: StringUtil = new StringUtil()

    static getSingleInstance(): StringUtil {
        return StringUtil._singleInstance
    }

    /**
     * Extracts filename from a wikilink string
     * Handles both formats: [[filename]] and [[filename|display]]
     * 
     * @param wikilinkStr - Wikilink string to parse
     * @returns Extracted filename, or '_' if parsing fails
     */
    toFileName(wikilinkStr: string): string {
        return (
            Constants.REGEX_WIKILINK_WITH_PIPE.exec(wikilinkStr)?.groups?.fn ||
            Constants.REGEX_WIKILINK_WITHOUT_PIPE.exec(wikilinkStr)?.groups?.fn ||
            '_'
        )
    }

    /**
     * Counts unique values for a tag property across all gallery files
     * 
     * @param tagNameSpaceStr - Tag reference string
     * @returns Count of unique values for this tag
     */
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

    /**
     * Converts a folder path part into a rendered markdown representation
     * Creates wikilinks if the note exists, otherwise returns plain text
     * 
     * @param part - Folder path part to render
     * @returns Rendered markdown string (wikilink or plain text)
     */
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

    /**
     * Renders a complete folder path with wikilinks
     * 
     * @param folder - Folder object with path property
     * @returns Rendered folder path string
     */
    getRenderedFolderPath(folder: any): string {
        return folder.path
            .split('/')
            .map((part: string) => this.getRenderedFolderPathPart(part))
            .join('/')
    }

    /**
     * Counts descendant files in a folder matching an extension pattern
     * 
     * @param folder - Folder object
     * @param files - Array of all files in vault
     * @param extension - Extension regex pattern to match (default: all)
     * @returns Count of matching descendant files
     */
    getDecendantFilesCount(
        folder: any,
        files: any[],
        extension: RegExp = /.*/
    ): number {
        return files.filter(
            f => f.path.startsWith(folder.path + '/') && extension.exec(f.extension)
        ).length
    }

    /**
     * Replaces frontmatter block in file content
     * Preserves non-ctime/mtime properties from original frontmatter
     * 
     * @param fileContent - Original file content
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @param preFMBlock - Additional frontmatter block to prepend (optional)
     * @returns File content with replaced frontmatter
     */
    replaceFrontMatter(
        fileContent: string,
        ctime: string,
        mtime: string,
        preFMBlock: string = ''
    ): string {
        return (
            `---${preFMBlock}\nctime: ${ctime}\nmtime: ${mtime}\n---\n` +
            fileContent.replace(Constants.REGEX_FRONTMATTER_BLOCK, '')
        )
    }

    /**
     * Extracts year from file's uploaded date frontmatter property
     * 
     * @param galleryNoteFile - Gallery file object
     * @returns Year string in YYYY format, or '1000' if not found
     */
    getYear(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, Constants.DATE_YEAR_END_INDEX) || '1000'
        )
    }

    /**
     * Extracts month from file's uploaded date frontmatter property
     * 
     * @param galleryNoteFile - Gallery file object
     * @returns Month string in YYYY-MM format, or '1000-01' if not found
     */
    getMonth(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, Constants.DATE_MONTH_END_INDEX) || '1000-01'
        )
    }

    /**
     * Extracts day from file's uploaded date frontmatter property
     * 
     * @param galleryNoteFile - Gallery file object
     * @returns Day string in YYYY-MM-DD format, or '1000-01-01' if not found
     */
    getDay(galleryNoteFile: any): string {
        return (
            app.metadataCache
                .getFileCache(galleryNoteFile)
                ?.frontmatter?.uploaded?.slice(0, Constants.DATE_DAY_END_INDEX) || '1000-01-01'
        )
    }
}

/**
 * Utility for file processing and generation
 * Orchestrates file content generation, updates, and batch operations
 */
class FileProcesserUtil {
    private static readonly _singleInstance: FileProcesserUtil =
        new FileProcesserUtil()

    static getSingleInstance(): FileProcesserUtil {
        return FileProcesserUtil._singleInstance
    }

    /**
     * Gets updated file content, comparing with existing frontmatter
     * Avoids unnecessary updates if content hasn't changed
     * 
     * @param file - File object
     * @param data - Original file content
     * @param getSpecTypeFileContent - Generator function for this file type
     * @returns Updated file content
     */
    async getFileContent(
        file: any,
        data: string,
        getSpecTypeFileContent: FileContentGenerator
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

    /**
     * Creates a file processor function with a specific generator
     * 
     * @param getSpecTypeFileContent - Generator function for this file type
     * @returns Processor function for individual files
     */
    processFileWith(
        getSpecTypeFileContent: FileContentGenerator
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

    /**
     * Removes duplicate values from array-type frontmatter properties
     * Processes all markdown files in the vault
     */
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

    /**
     * Creates tag files from unresolved wikilinks in gallery notes
     * Identifies properties containing these links and creates corresponding tag files
     */
    createFilesFromUnresolvedLinksForAllGalleryNoteFiles(): void {
        const galleryNoteMDFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
        const unresolvedLinktexts = galleryNoteMDFiles.flatMap((f: any) =>
            Object.keys(app.metadataCache.unresolvedLinks?.[f.path] || {})
        )

        const logger = new Logger()
        logger.log('unresolvedLinktexts', unresolvedLinktexts)

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

            const folderPath = config.pathFolder.tag
            const destPath = folderPath + linktext + '.md'
            try {
                if (!app.vault.getAbstractFileByPath(destPath)) {
                    app.vault
                        .create(destPath, '')
                        .then((f: any) => app.metadataCache.getFileCache(f))
                }
            } catch (e) {
                logger.warn(`Failed to create tag file: ${destPath}`, e)
            }
        }
    }

    /**
     * Processes a single file with a generator function
     * 
     * @param path - File path
     * @param getSpecTypeFileContent - Generator function for this file type
     * @returns Promise that resolves when processing is complete
     */
    getProcessFilePromise(
        path: string,
        getSpecTypeFileContent: FileContentGenerator
    ): Promise<void> {
        const file = app.vault.getAbstractFileByPath(path)
        const fileProcesser = this.processFileWith(getSpecTypeFileContent)
        return fileProcesser(file)
    }

    /**
     * Organizes gallery notes into year-based subdirectories
     * Creates year folders and moves gallery note related files accordingly
     */
    batchMoveGalleryNoteFilesByYearUploaded(): void {
        const files = app.vault.getFiles()
        const mdfiles = app.vault.getMarkdownFiles()
        const candidates = mdfiles.filter((f: any) =>
            f.path.startsWith(config.pathFolder.gallery)
        )

        // First pass: create year folders
        for (const f of candidates) {
            if (f.path.split('/').length !== Constants.MARKDOWN_FILE_PATH_DEPTH) continue
            const year = stringUtil.getYear(f)
            const folderPath = `${f.parent.path}/${year}`
            if (!app.vault.getFolderByPath(folderPath))
                app.vault.createFolder(folderPath)
        }

        // Second pass: move files to year folders
        for (const f of candidates) {
            if (f.path.split('/').length !== Constants.MARKDOWN_FILE_PATH_DEPTH) continue
            const year = app.metadataCache
                .getFileCache(f)
                ?.frontmatter?.uploaded?.slice(0, Constants.DATE_YEAR_END_INDEX)
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

    /**
     * Standardizes gallery note cover file names to match the note name
     * Renames cover files to follow the pattern: <gallery-name>.<extension>
     */
    standardizeGalleryNoteCoverFileName(): void {
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.pathFolder.gallery))
        galleryNoteFiles.filter((f: any) => {
            const cover = app.metadataCache.getFileCache(f)?.frontmatter?.cover
            const res = Constants.REGEX_COVER_WIKILINK.exec(cover)
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

    /**
     * Refreshes metadata cache for all markdown files
     * Forces Obsidian to reparse file metadata
     */
    refreshCache(): void {
        app.vault
            .getMarkdownFiles()
            .forEach((f: any) => app.metadataCache.getFileCache(f))
    }
}

const dateUtil: DateUtil = DateUtil.getSingleInstance()
const arrayUtil: ArrayUtil = ArrayUtil.getSingleInstance()
const pathUtil: PathUtil = PathUtil.getSingleInstance()
const stringUtil: StringUtil = StringUtil.getSingleInstance()
const fileProcesserUtil: FileProcesserUtil =
    FileProcesserUtil.getSingleInstance()

/**
 * Unified logging utility
 * Provides consistent logging interface with prefixes and timestamp support
 */
class Logger {
    /**
     * Logs general information
     */
    log(message: string, ...args: any[]): void {
        console.log(message, ...args)
    }

    /**
     * Logs warning messages
     */
    warn(message: string, ...args: any[]): void {
        console.warn(message, ...args)
    }

    /**
     * Logs error messages with stack trace
     */
    error(message: string, ...args: any[]): void {
        console.error(message, ...args)
    }

    /**
     * Logs with a timing prefix
     */
    logTimed(operationName: string, message: string): void {
        console.log(`${Constants.LOG_PREFIX_TIMER}${operationName}: ${message}`)
    }
}

/**
 * Utility for file template generation
 * Generates content for various file types based on vault metadata
 */
class FileTemplateUtil {
    private static readonly _singleInstance: FileTemplateUtil =
        new FileTemplateUtil()

    static getSingleInstance(): FileTemplateUtil {
        return FileTemplateUtil._singleInstance
    }

    /**
     * Gets gallery tag file content
     * Includes backlinks, gallery items, and base template reference
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
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

    /**
     * Gets year-based file content
     * Filters gallery items by year from the file title
     * 
     * @param title - File title (format: gallery-year-YYYY)
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
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

    /**
     * Gets group file content with tag group MOC
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @param seealso - See also reference
     * @returns Generated file content
     */
    private getGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        seealso: string
    ): string {
        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n> seealso: ${seealso}\n\n${this._getTagGroupMOC(
            title
        )}\n`
    }

    /**
     * Gets tag metadata file content
     * Lists all tag groups with their counts
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
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

        const tagGroups = [
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

        const ol = tagGroups
            .map(value => `1. ${value} | ${stringUtil.getTagCount(value)}\n`)
            .join('')

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# tag\n\n> seealso: ${docs}\n\n${ol}`
    }

    /**
     * Gets tag group file content
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
    getTagGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        return this.getGroupFileContent(title, ctime, mtime, config.ref.docsTag)
    }

    /**
     * Gets uploader group file content
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
    getUploaderGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        _seealso?: string
    ): string {
        return this.getGroupFileContent(title, ctime, mtime, config.ref.docsMeta)
    }

    /**
     * Gets property file content
     * Includes base property dynamic reference
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated file content
     */
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

    /**
     * Gets README file content with folder structure statistics
     * Generates a table showing descendant file counts
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated README content
     */
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

        const tableStr = this._generateFolderStatisticsTable(folders, files)

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

    /**
     * Gets gallery notes metadata file content
     * Lists all gallery notes organized by date
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated content
     */
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
                Constants.REGEX_FRONTMATTER_SECTION(config.keywords.noteList),
                `## ${config.keywords.noteList}\n\n${gstr}\n`
            )

        return newData
    }

    /**
     * Gets gallery meta file content
     * Lists all gallery items with base template reference
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated content
     */
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
        return await this._getGalleryMetaFileContentWithSpecPath(
            _title,
            ctime,
            mtime,
            metaFilePath,
            galleryNoteFiles,
            preFMBlock
        )
    }

    /**
     * Gets eXHentai-specific gallery meta file content
     * Lists only gallery items with eXHentai URLs
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated content
     */
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

    /**
     * Gets nHentai-specific gallery meta file content
     * Lists only gallery items with nHentai URLs
     * 
     * @param title - File title
     * @param ctime - Creation time
     * @param mtime - Modification time
     * @returns Generated content
     */
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

    /**
     * Generates a folder statistics table
     * @private
     */
    private _generateFolderStatisticsTable(folders: any[], files: any[]): string {
        return `| Folder Path | DFC | DFMC | DFOC |\n| :--- | ---: | ---: | ---: |\n${folders
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
    }

    /**
     * Builds tag group index of values and their counts
     * @private
     */
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

    /**
     * Gets gallery meta file content for a specific path
     * Internal helper used by spec gallery content generators
     * @private
     */
    private async _getGalleryMetaFileContentWithSpecPath(
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
                Constants.REGEX_FRONTMATTER_SECTION(config.keywords.galleryItems),
                `## ${config.keywords.galleryItems}\n\n${gstr}\n`
            )

        return newData
    }
}

const fileTemplateUtil: FileTemplateUtil = FileTemplateUtil.getSingleInstance()

/**
 * Main orchestrator for the gallery index building process
 * Coordinates all file processing tasks and manages the execution workflow
 */
class Main {
    private static readonly logger: Logger = new Logger()

    /**
     * Entry point for the script
     * Initiates the main async process with error handling
     */
    static main(): void {
        Main.asyncMain().catch(err =>
            Main.logger.error('unhandled error in build-index-content main:', err)
        )
    }

    /**
     * Processes a single file with a specified generator function
     * Includes timing and logging
     * 
     * @param path - File path to process
     * @param fn - Generator function for this file type
     */
    private static async processSingleFileSpec(
        path: string,
        fn: FileContentGenerator
    ): Promise<void> {
        try {
            const timerName = `${Constants.LOG_PREFIX_TIMER}${fn.name}-${path}`
            console.time(timerName)
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${fn.name} ${path}`)
            await fileProcesserUtil.getProcessFilePromise(path, fn)
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${fn.name} ${path}`)
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error(`error processing ${path}`, e)
        }
    }

    /**
     * Processes all files in a directory with a specified generator function
     * Includes timing and logging
     * 
     * @param rootDirPath - Directory path to process
     * @param fn - Generator function for this file type
     */
    private static async processDirectorySpec(
        rootDirPath: string,
        fn: FileContentGenerator
    ): Promise<void> {
        try {
            const timerName = `${Constants.LOG_PREFIX_TIMER}${fn.name}-${rootDirPath}`
            console.time(timerName)
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${fn.name} ${rootDirPath}`)
            await Promise.all(
                app.vault
                    .getMarkdownFiles()
                    .filter((f: any) => f.path.startsWith(rootDirPath))
                    .map(fileProcesserUtil.processFileWith(fn))
            )
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${fn.name} ${rootDirPath}`)
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error(`error processing dir ${rootDirPath}`, e)
        }
    }

    /**
     * Removes duplicated values from array-type frontmatter properties
     * Includes timing and logging
     */
    private static clearFrontmatter(): void {
        try {
            const timerName =
                'timer-removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles'
            console.time(timerName)
            const operationName = fileProcesserUtil
                .removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles
                .name
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${operationName}`)
            fileProcesserUtil.removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles()
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${operationName}`)
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error('error removing duplicates', e)
        }
    }

    /**
     * Queues all single-file processing tasks
     * Single-file generators process specific files (README, metadata files, etc.)
     * 
     * @param tasks - Task queue to populate
     */
    private static pushTasksWithSingleFileSpec(tasks: Promise<any>[]): void {
        const singleFileSpecs: Array<[string, FileContentGenerator]> = [
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

    /**
     * Queues all directory-scoped processing tasks
     * Directory generators process all files within specified directories
     * 
     * @param tasks - Task queue to populate
     */
    private static pushTasksWithDirectorySpec(tasks: Promise<any>[]): void {
        const dirSpecs: Array<[string, FileContentGenerator]> = [
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

    /**
     * Main async orchestration method
     * Executes all processing stages in order:
     * 1. Cache refresh
     * 2. File creation and batch operations
     * 3. Single-file processing
     * 4. Directory-scoped processing
     * 5. Frontmatter cleanup
     */
    static async asyncMain(): Promise<void> {
        console.time('run_script')
        Main.logger.log(`${Constants.LOG_STARTED_SCRIPT} (time="${new Date()}")`)

        const tasks: Promise<any>[] = []

        // Stage 1: Preparatory - refresh metadata cache
        tasks.push(Promise.resolve(fileProcesserUtil.refreshCache()))
        await Promise.all(tasks)

        // Stage 2: File creation and batch operations
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

        // Stage 3: Single-file processing
        tasks.length = 0
        Main.pushTasksWithSingleFileSpec(tasks)
        await Promise.all(tasks)

        // Stage 4: Cache refresh before directory processing
        tasks.length = 0
        tasks.push(Promise.resolve(fileProcesserUtil.refreshCache()))
        await Promise.all(tasks)

        // Stage 5: Directory-scoped processing and cleanup
        tasks.length = 0
        Main.pushTasksWithDirectorySpec(tasks)
        tasks.push(Promise.resolve(Main.clearFrontmatter()))
        await Promise.all(tasks)

        Main.logger.log(`${Constants.LOG_ENDED_SCRIPT} (time="${new Date()}")`)
        console.timeEnd('run_script')
    }
}

Main.main()
