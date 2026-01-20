

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
 * Unified application configuration class
 * Centralizes management of all paths, references, keywords, and property configurations
 * This singleton provides a single source of truth for all system-wide constants and mappings
 */
class AppConfig {
    // ==================== Folder path configuration ===================="
    readonly folders = {
        tag: 'gallery-tag/',
        gallery: 'galleries/',
        property: 'gallery-doc-property/',
        uploader: 'exhentai-uploader/',
        docsTag: 'gallery-doc/gallery-doc-gallery-tag/',
        docsYear: 'gallery-doc/gallery-doc-year/'
    }

    // ==================== File path configuration ====================
    readonly files = {
        readme: 'README.md',
        tagMeta: 'gallery-doc/gallery-doc/gallery-doc-gallery-tag.md',
        uploaderMeta: 'gallery-doc/gallery-doc/gallery-doc-exhentai-uploader.md',
        galleryNotes: 'gallery-doc/collection/collection-gallery-notes.md',
        galleryItems: 'gallery-doc/collection/collection-gallery-items.md',
        exhentaiGallery: 'gallery-doc/gallery-doc-galleries/gallery-url-exhentai.md',
        nhentaiGallery: 'gallery-doc/gallery-doc-galleries/gallery-url-nhentai.md'
    }

    // ==================== Wikilink reference configuration ====================
    readonly refs = {
        // Documentation references
        docsMeta: '[[gallery-doc|gallery-doc]]',
        docsTag: '[[gallery-doc-gallery-tag|gallery-doc-gallery-tag]]',
        docsCollection: '[[collection|collection]]',
        
        // Base template references (used for dynamic content generation in embedded notes)
        baseGalleryDynamic: '[[base-gallery-dynamic.base|base-gallery-dynamic.base]]',
        basePropertyDynamic: '[[base-property-dynamic.base|base-property-dynamic.base]]',
        baseGallery: '[[base-gallery.base|base-gallery.base]]',
        
        // Category tag group references (organized by content type for gallery classification)
        tagGroups: {
            artist: '[[exhentai-tg-artist|artist]]',
            categories: '[[exhentai-tg-categories|categories]]',
            character: '[[exhentai-tg-character|character]]',
            cosplayer: '[[exhentai-tg-cosplayer|cosplayer]]',
            female: '[[exhentai-tg-female|female]]',
            group: '[[exhentai-tg-group|group]]',
            keywords: '[[nhentai-tg-keywords|keywords]]',
            language: '[[exhentai-tg-language|language]]',
            location: '[[exhentai-tg-location|location]]',
            male: '[[exhentai-tg-male|male]]',
            mixed: '[[exhentai-tg-mixed|mixed]]',
            other: '[[exhentai-tg-other|other]]',
            parody: '[[exhentai-tg-parody|parody]]',
            temp: '[[exhentai-tg-temp|temp]]'
        },
        
        // Collection references (for organizing grouped content hierarchically)
        collectionGallery: '[[collection-gallery-items|collection-gallery-items]]',
        collectionGalleryNotes: '[[collection-gallery-notes|collection-gallery-notes]]'
    }

    // ==================== Keywords configuration ===================="
    readonly keywords = {
        exhentai: 'exhentai',
        nhentai: 'nhentai',
        galleryItems: '[[gallery-items|gallery-items]]',
        noteList: 'note-list'
    }

    // ==================== Frontmatter property field configuration ====================
    readonly properties = [
        'artist', 'group', 'categories', 'character', 'parody',
        'language', 'cosplayer', 'female', 'location', 'male',
        'mixed', 'other', 'temp', 'keywords', 'uploader'
    ]

    /**
     * Retrieves all tag group reference wikilinks
     * Provides a convenient way to iterate over all available tag group categories
     * Used for generating tag metadata files and aggregate tag listings
     * 
     * @returns Array of wikilink strings for all tag groups (14 categories total)
     */
    getAllTagGroupRefs(): string[] {
        return Object.values(this.refs.tagGroups)
    }
}

const config = new AppConfig()

/**
 * Generic singleton factory for creating and managing single instances
 * Reduces boilerplate code for singleton pattern implementation
 */
class SingletonFactory {
    private static readonly instances = new Map<string, any>()

    static getInstance<T>(key: string, factory: () => T): T {
        if (!this.instances.has(key)) {
            this.instances.set(key, factory())
        }
        return this.instances.get(key)
    }
}

/**
 * Utility for date/time operations
 * Provides consistent date formatting across the application
 */
class DateUtil {
    private static readonly instance = SingletonFactory.getInstance('DateUtil', () => new DateUtil())

    static getInstance(): DateUtil {
        return this.instance
    }

    /**
     * Returns current date in ISO format with timezone information
     * Example: 2026-01-18T15:30:45+08:00
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
    private static readonly instance = SingletonFactory.getInstance('ArrayUtil', () => new ArrayUtil())

    static getInstance(): ArrayUtil {
        return this.instance
    }

    /**
     * Removes duplicate entries from an array while preserving order
     */
    uniqueArray<T>(arr: T[]): T[] {
        return Array.from(new Set(arr))
    }

    /**
     * Groups array elements by a key function
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
     */
    safeArray<T>(v: T | T[] | undefined | null): T[] {
        if (!v) return []
        return Array.isArray(v) ? v : [v]
    }
}

/**
 * File path and content processing utility class
 * Handles path comparison, gallery item representations, and grouped/hierarchical list generation
 * Provides formatting logic for gallery items with metadata and cover images
 */
class PathUtil {
    private static readonly instance = SingletonFactory.getInstance('PathUtil', () => new PathUtil())

    static getInstance(): PathUtil {
        return this.instance
    }

    /**
     * Compares two gallery file paths for sorting by upload date
     * Primary sort: by uploaded date property in descending order (newest first)
     * Secondary sort: alphabetically (for items with same upload date)
     * 
     * @param path1 - First file path to compare
     * @param path2 - Second file path to compare
     * @returns Negative if path1 < path2, positive if path1 > path2, 0 if equal
     */
    comparePathByUploadedDate(path1: string, path2: string): number {
        const f1 = app.vault.getAbstractFileByPath(path1)
        const f2 = app.vault.getAbstractFileByPath(path2)
        const fc1 = app.metadataCache.getFileCache(f1)
        const fc2 = app.metadataCache.getFileCache(f2)
        const v1 = String(fc1?.frontmatter?.uploaded || '_')
        const v2 = String(fc2?.frontmatter?.uploaded || '_')
        // Sort in descending order (newest items first)
        const result = v2.localeCompare(v1)
        if (result !== 0) {
            return result
        }
        return path2.localeCompare(path1)
    }

    /**
     * Generates a markdown representation string for a gallery file
     * Includes formatted wikilink, Japanese/English title display, and optional cover thumbnail image
     * Returns a numbered list item formatted for markdown output
     * 
     * @param path - Gallery file path
     * @returns Formatted markdown string for the gallery item in list format
     */
    getGalleryItemRepresentationStr(path: string): string {
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
     * Generates comma-separated wikilinks for non-gallery note references
     * Used to display "see also" references to related documentation or notes
     * 
     * @param nonGalleryNotePaths - Set of non-gallery file paths to link to
     * @returns Formatted comma-separated wikilink string for all provided paths
     */
    getNonGalleryNotesStr(nonGalleryNotePaths: Set<string>): string {
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
     * Generates a simple flat list of gallery items
     * Items are sorted by upload date (newest first) and formatted as numbered markdown list
     * 
     * @param galleryNotePaths - Set of gallery file paths to render
     * @returns Formatted markdown list of gallery items (no grouping by date)
     */
    getGalleryItemsSimpleList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.comparePathByUploadedDate.bind(this)
        )
        return gls.map(p => this.getGalleryItemRepresentationStr(p)).join('\n')
    }

    /**
     * Generates a hierarchical grouped list of gallery items organized by year/month/day
     * Creates a nested markdown structure with heading levels for temporal organization
     * Useful for displaying large galleries organized by upload date with visual hierarchy
     * 
     * @param galleryNotePaths - Set of gallery file paths to render and group
     * @returns Formatted markdown with year/month/day grouping (### for year, #### for month, ##### for day)
     */
    getGalleryItemsGroupedList(galleryNotePaths: Set<string>): string {
        const gls = [...galleryNotePaths].sort(
            this.comparePathByUploadedDate.bind(this)
        )
        const groupedByYear = arrayUtil.groupBy(gls, gnPath =>
            stringUtil.getYear(app.vault.getAbstractFileByPath(gnPath))
        )
        const parts: string[] = groupedByYear
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([yearKey, yearGroup]) => this.buildYearSection(yearKey, yearGroup))
        return parts.join('\n\n')
    }

    /**
     * Constructs a year section of the grouped list hierarchy
     * Groups all items from a year into months, each with its own section
     * 
     * @param yearKey - Year string in YYYY format
     * @param yearGroup - Array of file paths for all items in this year
     * @returns Array of markdown strings representing the year section and its contents
     */
    private buildYearSection(yearKey: string, yearGroup: string[]): string[] {
        const groupedByMonth = arrayUtil.groupBy(yearGroup, gnPath =>
            stringUtil.getMonth(app.vault.getAbstractFileByPath(gnPath))
        )
        const yearSectionContentParts: string[] = groupedByMonth
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([monthKey, monthGroup]) => this.buildMonthSection(monthKey, monthGroup))
        return [`### ${yearKey}`, ...yearSectionContentParts] as string[]
    }

    /**
     * Constructs a month section of the grouped list hierarchy
     * Groups all items from a month into days, each with its own subsection
     * 
     * @param monthKey - Month string in YYYY-MM format
     * @param monthGroup - Array of file paths for all items in this month
     * @returns Array of markdown strings representing the month section and its contents
     */
    private buildMonthSection(monthKey: string, monthGroup: string[]): string[] {
        const groupedByDay = arrayUtil.groupBy(monthGroup, gnPath =>
            stringUtil.getDay(app.vault.getAbstractFileByPath(gnPath))
        )
        const daySectionContentParts: string[] = groupedByDay
            .sort((a, b) => b[0].localeCompare(a[0]))
            .flatMap(([dayKey, dayGroup]): string[] => [
                `##### ${dayKey}`,
                dayGroup
                    .map(p => this.getGalleryItemRepresentationStr(p))
                    .join('\n')
            ])
        return [`#### ${monthKey}`, ...daySectionContentParts] as string[]
    }

    /**
     * Retrieves the final gallery items string with grouping applied
     * This is the public entry point that delegates to the grouping logic
     * 
     * @param galleryNotePaths - Set of gallery file paths to render
     * @returns Complete formatted markdown string with hierarchical year/month/day grouping
     */
    getGalleryItemsStr(galleryNotePaths: Set<string>): string {
        return this.getGalleryItemsGroupedList(galleryNotePaths)
    }
}

/**
 * Utility for string operations
 * Handles wikilink parsing, file naming, and metadata extraction
 */
class StringUtil {
    private static readonly instance = SingletonFactory.getInstance('StringUtil', () => new StringUtil())

    static getInstance(): StringUtil {
        return this.instance
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
            .filter((f: any) => f.path.startsWith(config.folders.gallery))
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
    private static readonly instance = SingletonFactory.getInstance('FileProcesserUtil', () => new FileProcesserUtil())

    static getInstance(): FileProcesserUtil {
        return this.instance
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
            .filter((f: any) => f.path.startsWith(config.folders.gallery))
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
            const propertyName = config.properties.find(
                (pn: any) =>
                    galleryMDFileCaches.filter((fc: any) =>
                        arrayUtil.safeArray((fc.frontmatter || {})[pn]).includes(value)
                    ).length !== 0
            )

            const folderPath = config.folders.tag
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
            f.path.startsWith(config.folders.gallery)
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
            .filter((f: any) => f.path.startsWith(config.folders.gallery))
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

const dateUtil: DateUtil = DateUtil.getInstance()
const arrayUtil: ArrayUtil = ArrayUtil.getInstance()
const pathUtil: PathUtil = PathUtil.getInstance()
const stringUtil: StringUtil = StringUtil.getInstance()
const fileProcesserUtil: FileProcesserUtil = FileProcesserUtil.getInstance()

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
 * Specialized file content generation utility class
 * Responsible for template generation for various file types including tags, uploaders, and metadata
 * Handles complex content creation logic for gallery indexing and documentation
 */
class ContentGenerator {
    private static readonly instance = SingletonFactory.getInstance('ContentGenerator', () => new ContentGenerator())

    static getInstance(): ContentGenerator {
        return this.instance
    }

    /**
     * Generates standard frontmatter header with content body
     * Creates a complete file with frontmatter metadata and markdown content
     * 
     * @param title - Document title for the main heading
     * @param ctime - Creation timestamp in ISO format
     * @param mtime - Last modification timestamp in ISO format
     * @param contentBody - Markdown content to place after frontmatter
     * @param preFMBlock - Additional frontmatter properties to prepend before timestamps
     * @returns Complete formatted file content with frontmatter and body
     */
    private generateStandardContent(
        title: string,
        ctime: string,
        mtime: string,
        contentBody: string,
        preFMBlock: string = ''
    ): string {
        return `---${preFMBlock}\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n${contentBody}`
    }

    /**
     * Generates content with backlinks and gallery items
     * Common base method for multiple template types that need to display backlinks and gallery lists
     * Automatically filters and formats content based on provided filter functions
     * 
     * @param title - Document title
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @param backlinksFilter - Predicate function to filter relevant backlinks (e.g., exclude galleries)
     * @param galleryFilter - Predicate function to filter gallery items (e.g., include only galleries)
     * @param additionalContent - Optional extra content to insert before gallery section
     * @returns Generated file content with filtered backlinks and galleries
     */
    private generateContentWithBacklinksAndGallery(
        title: string,
        ctime: string,
        mtime: string,
        backlinksFilter: (path: string) => boolean,
        galleryFilter: (path: string) => boolean,
        additionalContent: string = '',
    ): string {
        const f = app.metadataCache.getFirstLinkpathDest(title)
        const backlinks = app.metadataCache.getBacklinksForFile(f)?.data
        const paths = backlinks ? [...backlinks.keys()] : []

        const ngstr = pathUtil.getNonGalleryNotesStr(new Set(paths.filter(backlinksFilter)))
        const gstr = pathUtil.getGalleryItemsStr(new Set(paths.filter(galleryFilter)))

        const seealsoSection = ngstr ? `> seealso: ${ngstr}\n\n` : ''
        const gallerySection = (gstr?.length === 0) ? "" : `## ${config.keywords.galleryItems}\n\n${gstr}\n`;

        const contentBody = `${seealsoSection}${additionalContent}${gallerySection}`
        return this.generateStandardContent(title, ctime, mtime, contentBody)
    }

    /**
     * Generates tag file content
     * Includes backlinks from related notes, gallery items, and base template reference
     * Used for generating individual tag pages that aggregate related galleries
     * 
     * @param title - Tag name
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted tag file content
     */
    async generateTagFileContent(
        title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const baseTemplate = `!${config.refs.baseGalleryDynamic}\n\n`
        return this.generateContentWithBacklinksAndGallery(
            title,
            ctime,
            mtime,
            i => !i.startsWith(config.folders.gallery) && i !== config.files.readme,
            i => i.startsWith(config.folders.gallery),
            baseTemplate
        )
    }

    /**
     * Generates year-based index file content
     * Filters gallery items by the year extracted from the file title (e.g., gallery-year-2024)
     * Displays all galleries uploaded in that specific year organized chronologically
     * 
     * @param title - Year identifier in format like 'gallery-year-2024'
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted year index file content
     */
    async generateYearFileContent(
        title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const year = title.replace(/^gallery-year-/, '')
        const galleryNotePaths = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.folders.gallery))
            .filter((f: any) => stringUtil.getYear(f) === year)
            .map((f: any) => f.path)

        const f = app.metadataCache.getFirstLinkpathDest(title)
        const backlinks = app.metadataCache.getBacklinksForFile(f)?.data
        const paths = backlinks ? [...backlinks.keys()] : []

        const ngstr = pathUtil.getNonGalleryNotesStr(
            new Set(
                paths
                    .filter(i => !i.startsWith(config.folders.gallery))
                    .filter(i => i !== config.files.readme)
            )
        )

        const gstr = pathUtil.getGalleryItemsStr(new Set(galleryNotePaths))
        const seealsoSection = ngstr ? `> seealso: ${ngstr}\n\n` : ''

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# ${title}\n\n${seealsoSection}## ${config.keywords.galleryItems}\n\n${gstr}\n`
    }

    /**
     * Generates tag metadata file content (central tag index)
     * Lists all available tag groups with their unique value counts
     * Used as the master index for navigating all tag categories (14 categories total)
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted tag metadata file content with all tag group listings
     */
    async generateTagMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const tagGroups = config.getAllTagGroupRefs()
        const ol = tagGroups
            .map(value => `1. ${value} | ${stringUtil.getTagCount(value)}\n`)
            .join('')

        return `---\nctime: ${ctime}\nmtime: ${mtime}\n---\n\n# tag\n\n> seealso: ${config.refs.docsMeta}\n\n${ol}`
    }

    /**
     * Generates group file content for tag groups and uploader groups
     * Common method for both tag-group and uploader-group file generation
     * Creates a master-of-contents style listing with counts for each category value
     * 
     * @param title - Group name (e.g., 'exhentai-tg-artist' or 'exhentai-uploader')
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @param seealso - Documentation wikilink to display as reference
     * @returns Complete formatted group file content
     */
    private generateGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
        seealso: string
    ): string {
        const body = `> seealso: ${seealso}\n\n${this.generateTagGroupIndex(title)}\n`
        return this.generateStandardContent(title, ctime, mtime, body)
    }

    /**
     * Generates tag group index with value listings
     * Builds a numbered list of all unique values for a specific tag property
     * Shows count of galleries for each value to provide usage metrics
     * 
     * @param title - Tag group title to extract property name from
     * @returns Formatted markdown list of tag values with counts
     */
    private generateTagGroupIndex(title: string): string {
        const property = title.replace(/^(gallery-doc-)?((ex|n)hentai-)?(tg-)?/, '')
        const galleryMDFileCaches = app.vault
            .getMarkdownFiles()
            .filter((f: any) => f.path.startsWith(config.folders.gallery))
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
     * Generates tag group file content
     * Creates index page for a specific tag category (e.g., artist, character, language)
     * 
     * @param title - Tag group name
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted tag group file content
     */
    async generateTagGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        return this.generateGroupFileContent(title, ctime, mtime, config.refs.docsTag)
    }

    /**
     * Generates uploader group file content
     * Creates index page for gallery uploaders with their upload counts
     * 
     * @param title - Uploader identifier
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted uploader group file content
     */
    async generateUploaderGroupFileContent(
        title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        return this.generateGroupFileContent(title, ctime, mtime, config.refs.docsMeta)
    }

    /**
     * Generates property file content
     * Creates index page for a specific metadata property with backlink references
     * Includes base template reference for dynamic content generation
     * 
     * @param title - Property name (e.g., 'artist', 'character')
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted property file content
     */
    async generatePropertyFileContent(
        title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const baseTemplate = `!${config.refs.basePropertyDynamic}\n`
        return this.generateContentWithBacklinksAndGallery(
            title,
            ctime,
            mtime,
            i => !i.startsWith(config.folders.gallery) && i !== config.files.readme,
            i => false,
            baseTemplate
        )
    }

    /**
     * Generates README file content with folder structure statistics
     * Creates a comprehensive overview table showing descendant file counts for each folder
     * Table columns: Folder Path | DFC (all files) | DFMC (markdown files) | DFOC (other files)
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted README file content
     */
    async generateReadmeFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const file = app.vault.getAbstractFileByPath(config.files.readme)
        const fileContent = await app.vault.read(file)

        const files = app.vault.getFiles()
        const folders = app.vault
            .getAllFolders()
            .sort((a: any, b: any) => a.path.localeCompare(b.path))

        const tableStr = this.generateFolderStatisticsTable(folders, files)

        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime)
            .replace(
                /(?<=\n)## folder-struct\n[^#]*(?=\n##\s)/,
                '## folder-struct\n\n> DFC stands for the total number of descendant files\n\n' +
                tableStr +
                '\n'
            )

        return newData
    }

    /**
     * Generates gallery notes metadata file content
     * Lists all gallery note files organized chronologically (newest first)
     * Creates a master index of all galleries with their metadata and cover images
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted gallery notes metadata file content
     */
    async generateGalleryNotesMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const metaFilePath = config.files.galleryNotes
        const noteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.refs.collectionGalleryNotes)
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
            .map((p: string) => pathUtil.getGalleryItemRepresentationStr(p))
            .join('\n')

        const preFMBlock = `\nup:\n  - "${config.refs.docsCollection}"`
        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime, preFMBlock)
            .replace(
                Constants.REGEX_FRONTMATTER_SECTION(config.keywords.noteList),
                `## ${config.keywords.noteList}\n\n${gstr}\n`
            )

        return newData
    }

    /**
     * Generates gallery metadata file content (common internal helper)
     * Shared implementation for different gallery category files (all, exhentai, nhentai)
     * Filters gallery items and renders them with specified frontmatter
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @param metaFilePath - Path to the metadata file being updated
     * @param galleryNoteFiles - Pre-filtered array of gallery files to include
     * @param preFMBlock - Additional frontmatter properties to prepend
     * @returns Complete formatted gallery metadata file content
     */
    private async generateGalleryMetaFileContent(
        _title: string,
        ctime: string,
        mtime: string,
        metaFilePath: string,
        galleryNoteFiles: any[],
        preFMBlock: string = ''
    ): Promise<string> {
        const file = app.vault.getAbstractFileByPath(metaFilePath)
        const fileContent = await app.vault.read(file)
        const gstr = pathUtil.getGalleryItemsStr(new Set(galleryNoteFiles.map(f => f.path)))

        const newData = stringUtil
            .replaceFrontMatter(fileContent, ctime, mtime, preFMBlock)
            .replace(
                Constants.REGEX_FRONTMATTER_SECTION(config.keywords.galleryItems),
                `## ${config.keywords.galleryItems}\n\n${gstr}\n`
            )

        return newData
    }

    /**
     * Generates generic gallery items file content (all galleries)
     * Master collection of all gallery items regardless of source site
     * Includes base template reference for dynamic content
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted gallery items file content
     */
    async generateGalleryItemsFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.refs.collectionGallery)
            )
        const preFMBlock = `\nup:\n  - "${config.refs.docsCollection}"\nbases:\n  - "${config.refs.baseGallery}"`
        return await this.generateGalleryMetaFileContent(
            _title,
            ctime,
            mtime,
            config.files.galleryItems,
            galleryNoteFiles,
            preFMBlock
        )
    }

    /**
     * Generates eXHentai-specific gallery file content
     * Lists only gallery items that have eXHentai URLs in their metadata
     * Provides a filtered view of galleries from the eXHentai source site
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted eXHentai gallery file content
     */
    async generateExhentaiGalleryFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.refs.collectionGallery)
            )
            .filter((f: any) =>
                (app.metadataCache.getFileCache(f)?.frontmatter?.url || '').includes(
                    config.keywords.exhentai
                )
            )
        return await this.generateGalleryMetaFileContent(
            _title,
            ctime,
            mtime,
            config.files.exhentaiGallery,
            galleryNoteFiles
        )
    }

    /**
     * Generates nHentai-specific gallery file content
     * Lists only gallery items that have nHentai URLs in their metadata
     * Provides a filtered view of galleries from the nHentai source site
     * 
     * @param _title - File title (unused, kept for signature consistency)
     * @param ctime - Creation timestamp
     * @param mtime - Modification timestamp
     * @returns Complete formatted nHentai gallery file content
     */
    async generateNhentaiGalleryFileContent(
        _title: string,
        ctime: string,
        mtime: string,
    ): Promise<string> {
        const galleryNoteFiles = app.vault
            .getMarkdownFiles()
            .filter((f: any) =>
                arrayUtil
                    .safeArray(app.metadataCache.getFileCache(f)?.frontmatter?.up)
                    .includes(config.refs.collectionGallery)
            )
            .filter((f: any) =>
                (app.metadataCache.getFileCache(f)?.frontmatter?.url || '').includes(
                    config.keywords.nhentai
                )
            )
        return await this.generateGalleryMetaFileContent(
            _title,
            ctime,
            mtime,
            config.files.nhentaiGallery,
            galleryNoteFiles
        )
    }

    /**
     * Generates folder statistics table for README
     * Creates a markdown table with descendant file counts for each folder
     * Helps monitor vault organization and file distribution
     * 
     * @param folders - Array of all folder objects in the vault
     * @param files - Array of all file objects in the vault
     * @returns Formatted markdown table with folder statistics
     */
    private generateFolderStatisticsTable(folders: any[], files: any[]): string {
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
}

const fileTemplateUtil: ContentGenerator = ContentGenerator.getInstance()

/**
 * Main program orchestrator
 * Manages the complete execution workflow for the gallery index building process
 * Coordinates all file processing tasks and maintains the 6-stage processing pipeline
 * 
 * Execution pipeline stages:
 * 1. Cache Refresh - Ensures metadata is current before processing
 * 2. Batch Operations - Creates unresolved links, organizes years, standardizes filenames
 * 3. Single File Processing - Generates README and critical metadata files
 * 4. Cache Refresh - Updates metadata again before directory processing
 * 5. Directory Processing - Batch generates tags, years, properties, uploaders
 * 6. Cleanup - Removes duplicate values from frontmatter array properties
 */
class Main {
    private static readonly logger: Logger = new Logger()

    /**
     * Script entry point
     * Initiates the main async workflow with error handling
     * Catches and logs any unhandled errors from the async pipeline
     */
    static main(): void {
        Main.asyncMain().catch(err =>
            Main.logger.error('Unhandled exception during script execution:', err)
        )
    }

    /**
     * Executes a timed synchronous operation with logging
     * Records start/end timestamps and logs operation status
     * Catches and logs any errors without stopping execution
     * 
     * @param operationName - Descriptive name of the operation (appears in logs)
     * @param operation - Synchronous function to execute
     */
    private static timedOperation(
        operationName: string,
        operation: () => void
    ): void {
        try {
            const timerName = `${Constants.LOG_PREFIX_TIMER}${operationName}`
            console.time(timerName)
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${operationName}`)
            operation()
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${operationName}`)
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error(`${operationName} execution failed`, e)
        }
    }

    /**
     * Executes a timed asynchronous operation with logging
     * Awaits async functions and records performance metrics
     * Catches and logs errors without stopping the pipeline
     * 
     * @param operationName - Descriptive name of the operation (appears in logs)
     * @param operation - Async function to execute and await
     */
    private static async timedAsyncOperation(
        operationName: string,
        operation: () => Promise<void>
    ): Promise<void> {
        try {
            const timerName = `${Constants.LOG_PREFIX_TIMER}${operationName}`
            console.time(timerName)
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${operationName}`)
            await operation()
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${operationName}`)
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error(`${operationName} execution failed`, e)
        }
    }

    /**
     * Processes a single file with its content generator
     * Calls the file processor utility and wraps it with timing/logging
     * 
     * @param path - Path to the file to process
     * @param fn - Content generator function for this file type
     */
    private static async processSingleFile(
        path: string,
        fn: FileContentGenerator
    ): Promise<void> {
        const operationName = `Process file: ${path}`
        await Main.timedAsyncOperation(operationName, () =>
            fileProcesserUtil.getProcessFilePromise(path, fn)
        )
    }

    /**
     * Processes all markdown files in a directory with a content generator
     * Applies the generator to all matching files and handles them in parallel
     * 
     * @param rootDirPath - Directory path to process
     * @param fn - Content generator function for all files in this directory
     */
    private static async processDirectory(
        rootDirPath: string,
        fn: FileContentGenerator
    ): Promise<void> {
        const operationName = `Process directory: ${rootDirPath}`
        await Main.timedAsyncOperation(operationName, async () => {
            await Promise.all(
                app.vault
                    .getMarkdownFiles()
                    .filter((f: any) => f.path.startsWith(rootDirPath))
                    .map(fileProcesserUtil.processFileWith(fn))
            )
        })
    }

    /**
     * Cleans up duplicate values in frontmatter array properties
     * Processes all markdown files and removes duplicate entries while preserving order
     */
    private static clearFrontmatter(): void {
        Main.timedOperation(
            'Clear duplicate frontmatter properties',
            () => {
                fileProcesserUtil.removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles()
            }
        )
    }

    /**
     * Builds configuration array for single-file processing tasks
     * Returns tuples of (file path, content generator function) for all files requiring updates
     * 
     * @returns Array of [filepath, generator] tuples for single-file processing
     */
    private static getSingleFileSpecs(): Array<[string, FileContentGenerator]> {
        return [
            [
                config.files.readme,
                fileTemplateUtil.generateReadmeFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.uploaderMeta,
                fileTemplateUtil.generateUploaderGroupFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.tagMeta,
                fileTemplateUtil.generateTagMetaFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.galleryNotes,
                fileTemplateUtil.generateGalleryNotesMetaFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.galleryItems,
                fileTemplateUtil.generateGalleryItemsFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.exhentaiGallery,
                fileTemplateUtil.generateExhentaiGalleryFileContent.bind(fileTemplateUtil)
            ],
            [
                config.files.nhentaiGallery,
                fileTemplateUtil.generateNhentaiGalleryFileContent.bind(fileTemplateUtil)
            ]
        ]
    }

    /**
     * Builds configuration array for directory-level processing tasks
     * Returns tuples of (directory path, content generator function) for batch file generation
     * Processes all files within each directory with the same generator
     * 
     * @returns Array of [dirpath, generator] tuples for directory-level processing
     */
    private static getDirectorySpecs(): Array<[string, FileContentGenerator]> {
        return [
            [
                config.folders.docsTag,
                fileTemplateUtil.generateTagGroupFileContent.bind(fileTemplateUtil)
            ],
            [
                config.folders.docsYear,
                fileTemplateUtil.generateYearFileContent.bind(fileTemplateUtil)
            ],
            [
                config.folders.property,
                fileTemplateUtil.generatePropertyFileContent.bind(fileTemplateUtil)
            ],
            [
                config.folders.uploader,
                fileTemplateUtil.generateTagFileContent.bind(fileTemplateUtil)
            ],
            [
                config.folders.tag,
                fileTemplateUtil.generateTagFileContent.bind(fileTemplateUtil)
            ]
        ]
    }

    /**
     * Processes all configured single files sequentially
     * Each file is processed with its dedicated content generator and logged independently
     */
    private static async processSingleFiles(): Promise<void> {
        const specs = Main.getSingleFileSpecs()
        for (const [path, fn] of specs) {
            await Main.processSingleFile(path, fn)
        }
    }

    /**
     * Processes all configured directories sequentially
     * Each directory is processed with its dedicated content generator for all matching files
     */
    private static async processDirectories(): Promise<void> {
        const specs = Main.getDirectorySpecs()
        for (const [rootDirPath, fn] of specs) {
            await Main.processDirectory(rootDirPath, fn)
        }
    }

    /**
     * Stage 1: Refresh cache
     * Ensures metadata cache is current before processing begins
     * Forces Obsidian to reparse all file metadata
     */
    private static async stageRefreshCache(): Promise<void> {
        await Main.timedAsyncOperation('Stage 1: Refresh metadata cache', () =>
            Promise.resolve(fileProcesserUtil.refreshCache())
        )
    }

    /**
     * Stage 2: Batch operations
     * Includes:
     * - Creating files from unresolved wikilinks
     * - Organizing gallery notes into year-based subdirectories
     * - Standardizing gallery cover filenames to match note names
     */
    private static async stageBatchOperations(): Promise<void> {
        await Main.timedAsyncOperation('Stage 2: Batch operations', async () => {
            await Promise.all([
                Promise.resolve(
                    fileProcesserUtil.createFilesFromUnresolvedLinksForAllGalleryNoteFiles()
                ),
                Promise.resolve(
                    fileProcesserUtil.batchMoveGalleryNoteFilesByYearUploaded()
                ),
                Promise.resolve(fileProcesserUtil.standardizeGalleryNoteCoverFileName())
            ])
        })
    }

    /**
     * Stage 3: Single file processing
     * Generates critical metadata files like README, tag index, uploader index, etc.
     */
    private static async stageSingleFileProcessing(): Promise<void> {
        await Main.timedAsyncOperation('Stage 3: Single file processing', () =>
            Main.processSingleFiles()
        )
    }

    /**
     * Stage 5: Directory processing
     * Batch generates content for all files in configured directories
     * Creates tag group files, year files, property files, uploader files
     */
    private static async stageDirectoryProcessing(): Promise<void> {
        await Main.timedAsyncOperation('Stage 5: Directory processing', () =>
            Main.processDirectories()
        )
    }

    /**
     * Stage 6: Cleanup
     * Removes duplicate values from frontmatter array properties across all files
     */
    private static stageCleanup(): void {
        Main.timedOperation('Stage 6: Cleanup and deduplication', () => {
            Main.clearFrontmatter()
        })
    }

    /**
     * Main async orchestration method
     * Executes all 6 processing stages sequentially to build the gallery index
     * Maintains consistent performance metrics and error handling throughout
     */
    static async asyncMain(): Promise<void> {
        console.time('run_script')
        Main.logger.log(`${Constants.LOG_STARTED_SCRIPT} (time="${new Date()}")`)

        // Stage 1: Refresh metadata cache
        await Main.stageRefreshCache()

        // Stage 2: File creation and batch operations
        await Main.stageBatchOperations()

        // Stage 3: Single-file processing
        await Main.stageSingleFileProcessing()

        // Stage 4: Refresh cache again before directory processing
        await Main.timedAsyncOperation('Stage 4: Refresh metadata cache (2)', () =>
            Promise.resolve(fileProcesserUtil.refreshCache())
        )

        // Stage 5: Directory processing (batch generation)
        await Main.stageDirectoryProcessing()

        // Stage 6: Cleanup and deduplication
        Main.stageCleanup()

        Main.logger.log(`${Constants.LOG_ENDED_SCRIPT} (time="${new Date()}")`)
        console.timeEnd('run_script')
    }
}

Main.main()
