# TypeScript 脚本重构指南

## 📋 重构概览

本文档详细记录了对 Obsidian 图库索引构建脚本的全面重构工作。

## 🎯 重构目标
1. **提升代码可读性** - 添加详细注释和文档
2. **改进代码维护性** - 提取常量，分解复杂方法
3. **增强类型安全** - 引入接口定义，减少 `any` 使用
4. **统一代码风格** - 规范命名和结构

## ✨ 核心改进

### 1. Constants 命名空间
提取所有魔法值到单个位置，便于管理和修改：

```typescript
namespace Constants {
    // 正则表达式
    export const REGEX_WIKILINK_WITH_PIPE = /^\[\[(?<fn>[^\|]*?)\|.*?\]\]$/
    export const REGEX_FRONTMATTER_BLOCK = /^---\r?\n[^]*?(?<=\n)---\r?\n/
    
    // 常数值
    export const MARKDOWN_FILE_PATH_DEPTH = 3
    export const DATE_YEAR_END_INDEX = 4
    
    // 日志前缀
    export const LOG_PREFIX_TIMER = 'timer-'
}
```

**优势**：
- ✅ 集中管理所有常量
- ✅ 易于全局修改
- ✅ 提高代码重用性

### 2. 类型接口定义
用具体接口替代 `any` 类型：

```typescript
interface VaultFile {
    path: string
    name: string
    basename: string
    extension: string
    parent: VaultFolder
}

interface FileCache {
    frontmatter?: Record<string, any>
}

type FileContentGenerator = (
    title: string,
    ctime: string,
    mtime: string
) => Promise<string>
```

**优势**：
- ✅ IDE 自动补全支持
- ✅ 类型检查支持
- ✅ 文档自动化

### 3. Logger 工具类
统一的日志接口：

```typescript
class Logger {
    log(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    logTimed(operationName: string, message: string): void
}
```

**使用方式**：
```typescript
const logger = new Logger()
logger.log('Processing started')
logger.warn('File not found')
logger.error('Operation failed', error)
```

### 4. 方法分解示例

#### 改进前（深层嵌套）
```typescript
getGStrASGroupedList(galleryNotePaths: Set<string>): string {
    const gls = [...galleryNotePaths].sort(...)
    const groupedByYear = arrayUtil.groupBy(gls, ...)
    const parts: string[] = groupedByYear
        .sort((a, b) => ...)
        .flatMap(([yearKey, yearGroup]) => {
            const groupedByMonth = arrayUtil.groupBy(...)
            const yearSectionContentParts: string[] = groupedByMonth
                .sort((a, b) => ...)
                .flatMap(([monthKey, monthGroup]) => {
                    // 120+ 行深层嵌套...
                })
            return [`### ${yearKey}`, ...yearSectionContentParts]
        })
    return parts.join('\n\n')
}
```

#### 改进后（清晰分层）
```typescript
getGStrASGroupedList(galleryNotePaths: Set<string>): string {
    const gls = [...galleryNotePaths].sort(...)
    const groupedByYear = arrayUtil.groupBy(gls, ...)
    const parts: string[] = groupedByYear
        .sort((a, b) => b[0].localeCompare(a[0]))
        .flatMap(([yearKey, yearGroup]) => 
            this._buildYearSection(yearKey, yearGroup)
        )
    return parts.join('\n\n')
}

private _buildYearSection(yearKey: string, yearGroup: string[]): string[] {
    const groupedByMonth = arrayUtil.groupBy(yearGroup, ...)
    const yearSectionContentParts = groupedByMonth
        .sort((a, b) => b[0].localeCompare(a[0]))
        .flatMap(([monthKey, monthGroup]) => 
            this._buildMonthSection(monthKey, monthGroup)
        )
    return [`### ${yearKey}`, ...yearSectionContentParts]
}

private _buildMonthSection(monthKey: string, monthGroup: string[]): string[] {
    // 处理月份级别的分组...
}
```

### 5. 注释文档完善

#### 类级注释
```typescript
/**
 * Utility for file path and content operations
 * Handles path comparisons, gallery representations, and nested list generation
 */
class PathUtil {
    // ...
}
```

#### 方法级注释
```typescript
/**
 * Generates a hierarchical grouped list of gallery items organized by year/month/day
 * 
 * @param galleryNotePaths - Set of gallery file paths
 * @returns Formatted markdown hierarchical list
 */
getGStrASGroupedList(galleryNotePaths: Set<string>): string {
    // ...
}
```

## 📊 重构前后对比

| 指标 | 改进前 | 改进后 | 变化 |
|------|-------|-------|------|
| 总行数 | 1183 | 1656 | +473 (主要是注释) |
| 注释行数 | ~50 | 250+ | 5倍增长 |
| 类型定义 | 少 | 完整 | 类型安全提升 |
| 常量提取 | 分散 | 集中 | 便于维护 |
| 编译错误 | 0 | 0 | ✅ 无回归 |

## 🔧 工具类职责划分

### DateUtil
- **职责**：日期/时间格式化
- **公开方法**：`getLocalISOStringWithTimezone()`

### ArrayUtil
- **职责**：数组操作和转换
- **公开方法**：`uniqueArray()`, `groupBy()`, `safeArray()`

### PathUtil
- **职责**：文件路径和内容表示
- **公开方法**：`compareGalleryPathWithPropertyUploaded()`, `getGStr()` 等
- **私有方法**：`_buildYearSection()`, `_buildMonthSection()`

### StringUtil
- **职责**：字符串操作和元数据提取
- **公开方法**：`toFileName()`, `getTagCount()`, `getYear()` 等

### FileProcesserUtil
- **职责**：文件处理和批量操作
- **公开方法**：`getFileContent()`, `processFileWith()` 等
- **私有方法**：内部辅助

### FileTemplateUtil
- **职责**：生成各类文件内容
- **公开方法**：`getTagFileContent()`, `getYearFileContent()` 等
- **私有方法**：`_buildYearSection()`, `_getTagGroupMOC()` 等

### Logger
- **职责**：统一的日志输出
- **公开方法**：`log()`, `warn()`, `error()`, `logTimed()`

## 🚀 执行流程改进

Main 类的执行顺序清晰化：

```
Stage 1: 缓存刷新
    ↓
Stage 2: 文件创建和批量操作
    ↓
Stage 3: 单文件处理
    ↓
Stage 4: 缓存刷新（准备目录处理）
    ↓
Stage 5: 目录级处理 + 清理
    ↓
完成
```

## 📝 命名规范

### 私有方法前缀
```typescript
private _buildYearSection()  // 私有方法用下划线前缀
private _getTagGroupMOC()    // 清晰表示私有性
```

### 常量命名
```typescript
export const LOG_PREFIX_TIMER = 'timer-'  // 全大写，下划线分隔
export const MARKDOWN_FILE_PATH_DEPTH = 3 // 清晰的意图
```

## ✅ 最佳实践

1. **使用常量替代魔法值**
   ```typescript
   // ❌ 不好
   if (f.path.split('/').length !== 3) continue
   
   // ✅ 好
   if (f.path.split('/').length !== Constants.MARKDOWN_FILE_PATH_DEPTH) continue
   ```

2. **优先用接口替代 any**
   ```typescript
   // ❌ 不好
   function process(file: any): void
   
   // ✅ 好
   function process(file: VaultFile): void
   ```

3. **添加详细的 JSDoc 注释**
   ```typescript
   /**
    * 清晰的功能描述
    * 
    * @param arg1 - 参数说明
    * @returns 返回值说明
    */
   function myFunction(arg1: string): string {
   ```

4. **提取复杂逻辑到私有方法**
   ```typescript
   // 将 10+ 行逻辑提取到私有方法
   private _extractedLogic(): void {
       // 具体实现
   }
   ```

## 🧪 测试建议

建议为以下方法添加单元测试：

```typescript
// DateUtil
- getLocalISOStringWithTimezone() 格式验证

// ArrayUtil
- uniqueArray() 去重效果
- groupBy() 分组逻辑
- safeArray() 边界情况

// StringUtil
- toFileName() 解析精度
- getYear/Month/Day() 日期提取
```

## 📚 维护指南

### 添加新常量
1. 在 `Constants` 命名空间中添加
2. 使用清晰的常量名
3. 添加必要的注释

### 修改日志格式
1. 更新 `Logger` 类的方法
2. 如需新增前缀，在 `Constants` 中定义

### 添加新的生成器
1. 在 `FileTemplateUtil` 中添加 `get*FileContent()` 方法
2. 在 `Main.pushTasksWithSingleFileSpec()` 中注册
3. 添加完整的 JSDoc 注释

## 📖 参考资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [JSDoc 标准](https://jsdoc.app/)
- [代码注释最佳实践](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
