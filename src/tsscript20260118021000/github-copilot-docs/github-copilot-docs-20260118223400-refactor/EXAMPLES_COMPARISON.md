# 📖 重构示例对比集合

## 目录
1. [常量提取](#常量提取)
2. [类型定义](#类型定义)
3. [日志统一](#日志统一)
4. [方法分解](#方法分解)
5. [文档补充](#文档补充)

---

## 常量提取

### 示例 1: 正则表达式常量化

#### ❌ 改进前
```typescript
getTagCount(tagNameSpaceStr: string): number {
    const result01 = /^\\[\\[(.*)|(.*)\\]\\]$/.exec(tagNameSpaceStr)
    const result02 = /^\\[\\[(.*)\\]\\]$/.exec(tagNameSpaceStr)
    // ... 其他代码
}

getRenderedFolderPathPart(part: string): string {
    // ... 代码中多处使用相同的正则
}

replaceF rontMatter(fileContent: string, ctime: string, mtime: string): string {
    // ... 又使用一次相似的正则
}
```

#### ✅ 改进后
```typescript
namespace Constants {
    export const REGEX_WIKILINK_WITH_PIPE = /^\\[\\[(?<fn>[^\\|]*?)\\|.*?\\]\\]$/
    export const REGEX_WIKILINK_WITHOUT_PIPE = /^\\[\\[(?<fn>[^\\|]*?)\\]\\]$/
    export const REGEX_FRONTMATTER_BLOCK = /^---\\r?\
[^]*?(?<=\
)---\\r?\
/
}

getTagCount(tagNameSpaceStr: string): number {
    const result01 = Constants.REGEX_WIKILINK_WITH_PIPE.exec(tagNameSpaceStr)
    const result02 = Constants.REGEX_WIKILINK_WITHOUT_PIPE.exec(tagNameSpaceStr)
}
```

**优势**:
- 一处修改，全局生效
- 便于维护和测试
- 代码意图更清晰

---

### 示例 2: 数值常量提取

#### ❌ 改进前
```typescript
getYear(galleryNoteFile: any): string {
    return app.metadataCache
        .getFileCache(galleryNoteFile)
        ?.frontmatter?.uploaded?.slice(0, 4) || '1000'  // 魔法数字 4
}

getMonth(galleryNoteFile: any): string {
    return app.metadataCache
        .getFileCache(galleryNoteFile)
        ?.frontmatter?.uploaded?.slice(0, 7) || '1000-01'  // 魔法数字 7
}

getDay(galleryNoteFile: any): string {
    return app.metadataCache
        .getFileCache(galleryNoteFile)
        ?.frontmatter?.uploaded?.slice(0, 10) || '1000-01-01'  // 魔法数字 10
}

batchMoveGalleryNoteFilesByYearUploaded(): void {
    for (const f of candidates) {
        if (f.path.split('/').length !== 3) continue  // 为什么是 3？
        const year = app.metadataCache
            .getFileCache(f)
            ?.frontmatter?.uploaded?.slice(0, 4)  // 又是 4...
    }
}
```

#### ✅ 改进后
```typescript
namespace Constants {
    export const DATE_YEAR_END_INDEX = 4
    export const DATE_MONTH_END_INDEX = 7
    export const DATE_DAY_END_INDEX = 10
    export const MARKDOWN_FILE_PATH_DEPTH = 3
}

getYear(galleryNoteFile: any): string {
    return app.metadataCache
        .getFileCache(galleryNoteFile)
        ?.frontmatter?.uploaded?.slice(0, Constants.DATE_YEAR_END_INDEX) || '1000'
}

batchMoveGalleryNoteFilesByYearUploaded(): void {
    for (const f of candidates) {
        if (f.path.split('/').length !== Constants.MARKDOWN_FILE_PATH_DEPTH) continue
        const year = app.metadataCache
            .getFileCache(f)
            ?.frontmatter?.uploaded?.slice(0, Constants.DATE_YEAR_END_INDEX)
    }
}
```

**优势**:
- 代码意图清晰
- 便于理解日期格式
- 一处修改影响全局

---

## 类型定义

### 示例 1: 替换 any 类型

#### ❌ 改进前
```typescript
class PathUtil {
    compareGalleryPathWithPropertyUploaded(path1: string, path2: string): number {
        const f1 = app.vault.getAbstractFileByPath(path1)  // 类型: any
        const f2 = app.vault.getAbstractFileByPath(path2)  // 类型: any
        const fc1 = app.metadataCache.getFileCache(f1)     // 类型: any
        const fc2 = app.metadataCache.getFileCache(f2)     // 类型: any
        // ... 无法获得代码补全和类型检查
    }
}
```

#### ✅ 改进后
```typescript
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

class PathUtil {
    compareGalleryPathWithPropertyUploaded(path1: string, path2: string): number {
        const f1: VaultFile = app.vault.getAbstractFileByPath(path1)
        const f2: VaultFile = app.vault.getAbstractFileByPath(path2)
        const fc1: FileCache = app.metadataCache.getFileCache(f1)
        const fc2: FileCache = app.metadataCache.getFileCache(f2)
        // ✅ 现在有类型检查和代码补全
    }
}
```

**优势**:
- IDE 提供自动补全
- TypeScript 编译器检查
- 文档效果

---

### 示例 2: 函数类型别名

#### ❌ 改进前
```typescript
class FileProcesserUtil {
    async getFileContent(
        file: any,
        data: string,
        getSpecTypeFileContent: (
            title: string,
            ctime: string,
            mtime: string
        ) => Promise<string>  // 长长的重复类型
    ): Promise<string> {
        // ...
    }

    processFileWith(
        getSpecTypeFileContent: (
            title: string,
            ctime: string,
            mtime: string
        ) => Promise<string>  // 又重复一遍
    ) {
        // ...
    }
}
```

#### ✅ 改进后
```typescript
// 定义类型别名
type FileContentGenerator = (
    title: string,
    ctime: string,
    mtime: string
) => Promise<string>

class FileProcesserUtil {
    async getFileContent(
        file: any,
        data: string,
        getSpecTypeFileContent: FileContentGenerator  // 清晰简洁
    ): Promise<string> {
        // ...
    }

    processFileWith(
        getSpecTypeFileContent: FileContentGenerator  // 复用
    ) {
        // ...
    }
}
```

**优势**:
- 代码更简洁
- 类型定义统一
- 便于修改

---

## 日志统一

### ❌ 改进前
```typescript
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
        console.log('started:', fn.name, path)  // 格式不一致
        await fileProcesserUtil.getProcessFilePromise(path, fn)
        console.log('ended:', fn.name, path)  // 格式不一致
        console.timeEnd(timerName)
    } catch (e) {
        console.error('error processing', path, e)  // 格式不一致
    }
}
```

### ✅ 改进后
```typescript
class Logger {
    log(message: string, ...args: any[]): void {
        console.log(message, ...args)
    }

    warn(message: string, ...args: any[]): void {
        console.warn(message, ...args)
    }

    error(message: string, ...args: any[]): void {
        console.error(message, ...args)
    }
}

class Main {
    private static readonly logger: Logger = new Logger()

    static main(): void {
        Main.asyncMain().catch(err =>
            Main.logger.error('unhandled error in build-index-content main:', err)
        )
    }

    private static async processSingleFileSpec(
        path: string,
        fn: FileContentGenerator
    ): Promise<void> {
        try {
            const timerName = `${Constants.LOG_PREFIX_TIMER}${fn.name}-${path}`
            console.time(timerName)
            Main.logger.log(`${Constants.LOG_PREFIX_STARTED} ${fn.name} ${path}`)  // 统一格式
            await fileProcesserUtil.getProcessFilePromise(path, fn)
            Main.logger.log(`${Constants.LOG_PREFIX_ENDED} ${fn.name} ${path}`)    // 统一格式
            console.timeEnd(timerName)
        } catch (e) {
            Main.logger.error(`error processing ${path}`, e)  // 统一格式
        }
    }
}
```

**优势**:
- 日志格式统一
- 便于日志分析
- 便于扩展（如添加时间戳、日志级别等）

---

## 方法分解

### 示例: 复杂嵌套逻辑的分解

#### ❌ 改进前（120+ 行深层嵌套）
```typescript
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
            // 第 2 层嵌套
            const groupedByMonth = arrayUtil.groupBy(yearGroup, gnPath =>
                stringUtil.getMonth(app.vault.getAbstractFileByPath(gnPath))
            )
            const yearSectionContentParts: string[] = groupedByMonth
                .sort((a, b) => b[0].localeCompare(a[0]))
                .flatMap(([monthKey, monthGroup]) => {
                    // 第 3 层嵌套
                    const groupedByDay = arrayUtil.groupBy(monthGroup, gnPath =>
                        stringUtil.getDay(app.vault.getAbstractFileByPath(gnPath))
                    )
                    const daySectionContentParts: string[] = groupedByDay
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .flatMap(([dayKey, dayGroup]): string[] => [
                            `##### ${dayKey}`,
                            dayGroup
                                .map(p => this.getGalleryPathRepresentationStr(p))
                                .join('\
')
                        ])
                    return [`#### ${monthKey}`, ...daySectionContentParts] as string[]
                })
            return [`### ${yearKey}`, ...yearSectionContentParts] as string[]
        })
    return parts.join('\
\
')
}
```

#### ✅ 改进后（清晰的 3 层结构）
```typescript
getGStrASGroupedList(galleryNotePaths: Set<string>): string {
    const gls = [...galleryNotePaths].sort(
        this.compareGalleryPathWithPropertyUploaded.bind(this)
    )
    const groupedByYear = arrayUtil.groupBy(gls, gnPath =>
        stringUtil.getYear(app.vault.getAbstractFileByPath(gnPath))
    )
    const parts: string[] = groupedByYear
        .sort((a, b) => b[0].localeCompare(a[0]))
        .flatMap(([yearKey, yearGroup]) => 
            this._buildYearSection(yearKey, yearGroup)
        )
    return parts.join('\
\
')
}

/**
 * 构建年度分组
 * @private
 */
private _buildYearSection(yearKey: string, yearGroup: string[]): string[] {
    const groupedByMonth = arrayUtil.groupBy(yearGroup, gnPath =>
        stringUtil.getMonth(app.vault.getAbstractFileByPath(gnPath))
    )
    const yearSectionContentParts: string[] = groupedByMonth
        .sort((a, b) => b[0].localeCompare(a[0]))
        .flatMap(([monthKey, monthGroup]) => 
            this._buildMonthSection(monthKey, monthGroup)
        )
    return [`### ${yearKey}`, ...yearSectionContentParts]
}

/**
 * 构建月份分组
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
                .join('\
')
        ])
    return [`#### ${monthKey}`, ...daySectionContentParts]
}
```

**优势**:
- 嵌套层级从 4 降到 2
- 每个方法职责清晰
- 易于理解和维护
- 便于重用

---

## 文档补充

### 示例: 完整的 JSDoc 注释

#### ❌ 改进前
```typescript
class StringUtil {
    toFileName(wikilinkStr: string): string {
        return (...)
    }

    getTagCount(tagNameSpaceStr: string): number {
        return (...)
    }
}
```

#### ✅ 改进后
```typescript
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
        // ... 实现
    }
}
```

**优势**:
- IDE 提示完整
- 文档自动生成
- 新开发者快速上手

---

## 综合示例: 完整改进展示

对比一个完整的方法改进：

### ❌ 原始版本
```typescript
class FileProcesserUtil {
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
}
```

### ✅ 改进版本
```typescript
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
     * Removes duplicate values from array-type frontmatter properties
     * Processes all markdown files in the vault.
     * 
     * This method iterates through all markdown files and checks each property
     * in their frontmatter. For array properties, it removes duplicates while
     * preserving the original order.
     */
    removeDuplicatedValueInArrayPropertyInFrontmatterForAllMarkdownFiles(): void {
        app.vault.getMarkdownFiles().forEach((f: any) => {
            const fc = app.metadataCache.getFileCache(f) || {}
            if (!fc.frontmatter) return
            
            this._deduplicateFrontmatterArrays(f, fc.frontmatter)
        })
    }

    /**
     * Deduplicates array values in frontmatter properties
     * @private
     */
    private _deduplicateFrontmatterArrays(
        file: VaultFile,
        frontmatter: Record<string, any>
    ): void {
        for (const key of Object.keys(frontmatter)) {
            const originalValue = frontmatter[key]
            if (!Array.isArray(originalValue)) continue
            
            const uniqueValue = arrayUtil.uniqueArray(originalValue)
            if (uniqueValue.length === originalValue.length) continue
            
            app.fileManager.processFrontMatter(file, (fm: any) => {
                fm[key] = uniqueValue
            })
        }
    }
}
```

**改进**:
- ✅ 添加了类级注释
- ✅ 添加了方法级注释
- ✅ 提取了子逻辑到私有方法
- ✅ 使用了类型接口
- ✅ 代码结构更清晰

---

## 总结表

| 改进方面 | 改进前 | 改进后 | 影响 |
|---------|-------|-------|------|
| **常量** | 分散 | 集中 | 便于维护 |
| **类型** | any | 接口 | IDE 支持 |
| **日志** | 混乱 | 统一 | 便于分析 |
| **方法** | 嵌套 | 分层 | 易读性高 |
| **文档** | 缺少 | 完整 | 易学性高 |

---

**这些改进共同提升了代码的可维护性和可读性！** 🎉
