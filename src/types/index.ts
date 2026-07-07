// ============================================================
// src/types/index.ts — 全局类型定义
// 卫星制造项目管理系统（Demo）v2 增量
// ============================================================

// ---------- 原始 BOM JSON 节点（bom_tree.json 的结构） ----------
export interface RawBomNode {
  level: number;
  part_no: string;
  name: string;
  spec?: string;
  package?: string;
  manufacturer?: string;
  quality_level?: string;
  form?: string;
  quantity?: string;
  location?: string;
  unit?: string;
  row?: number;
  children?: RawBomNode[];
}

// ---------- 枚举/字面量类型 ----------
/** 单机类型：EQ=单机设备, PT=零部件 */
export type UnitType = 'equipment' | 'part';
/** 投产状态 */
export type ProductionStatus = 'not_started' | 'in_progress' | 'completed';
/** 四阶段类型 */
export type PhaseType = 'design' | 'production' | 'integration' | 'ait';
/** AIT 工作类型 */
export type AitWorkType =
  | 'assembly'
  | 'electrical_test'
  | 'thermal_test'
  | 'mechanical_test'
  | 'noise_test'
  | 'emc_test'
  | 'custom';
/** AIT 工作状态 */
export type AitWorkStatus = 'pending' | 'in_progress' | 'completed';
/** 齐套状态 */
export type KitStatusType = 'complete' | 'partial' | 'none';
/** 主题模式 */
export type ThemeMode = 'light' | 'dark';
/** 齐套筛选 */
export type KitFilter = 'all' | 'electrical' | 'qualification' | 'flight';

// ---------- v2 导航：两级页面状态 ----------
/** 全局页面（无需选中项目） */
export type GlobalPage = 'overview' | 'project-management';

/** 项目内主页面（选中项目后激活） */
export type ProjectPage = 'tree' | 'kitboard' | 'phase' | 'ait';

/** 两级页面状态 */
export interface PageState {
  scope: 'global' | 'project';
  page: GlobalPage | ProjectPage;
}

// ---------- 单机三状态 ----------
export interface UnitStatus {
  /** 电性件是否齐套 */
  electrical: boolean;
  /** 鉴定件是否齐套 */
  qualification: boolean;
  /** 正样件是否齐套 */
  flight: boolean;
}

// ---------- 领域模型：单机/零部件 ----------
export interface Unit {
  partNo: string;
  name: string;
  spec: string;
  manufacturer: string;
  qualityLevel: string;
  form: string;
  quantity: number;
  location: string;
  unit: string;
  type: UnitType;
  /** 三状态齐套标记 */
  status: UnitStatus;
  /** 在整星中的状态列表，如 ['flight'] */
  inSatellite: string[];
  /** 整体齐套标记 */
  isKitComplete: boolean;
  productionStatus: ProductionStatus;
  /** ISO 8601 格式 'YYYY-MM-DD' */
  deliveryDate: string | null;
}

// ---------- 领域模型：分系统 ----------
export interface Subsystem {
  partNo: string;
  name: string;
  units: Unit[];
}

// ---------- 领域模型：整星 ----------
export interface Satellite {
  partNo: string;
  name: string;
  manufacturer: string;
  subsystems: Subsystem[];
}

// ---------- 领域模型：项目/批次（v2 多星） ----------
export interface Project {
  id: string;
  /** 项目名称，用户填写或导入生成，不再硬编码 */
  name: string;
  /** 卫星型号 */
  satelliteModel: string;
  /** 卫星列表（v1.0 的 satellite 单数改为复数数组） */
  satellites: Satellite[];
  /** 创建时间 ISO 8601 */
  createdAt: string;
  /** 最后更新时间 ISO 8601 */
  updatedAt: string;
}

// ---------- v2 新增：项目摘要（列表页用） ----------
export interface ProjectSummary {
  id: string;
  name: string;
  satelliteModel: string;
  satelliteCount: number;
  totalMaterials: number;
  kitRate: number;
  updatedAt: string;
}

// ---------- v2 新增：单星摘要（卫星切换/对比用） ----------
export interface SatelliteSummary {
  partNo: string;
  name: string;
  totalMaterials: number;
  kitRate: number;
  subsystemCount: number;
}

// ---------- 阶段临时任务 ----------
export interface Task {
  id: string;
  name: string;
  phaseType: PhaseType;
  relatedUnitPartNo: string | null;
  owner: string;
  /** 'YYYY-MM-DD' */
  dueDate: string | null;
  /** ISO 8601 datetime */
  createdAt: string;
}

// ---------- AIT 工作项 ----------
export interface AitWork {
  id: string;
  name: string;
  type: AitWorkType;
  /** 全局排序序号 */
  order: number;
  status: AitWorkStatus;
  relatedUnitPartNo: string | null;
  /** 'YYYY-MM-DD' */
  plannedDate: string | null;
  actualDate: string | null;
  owner: string;
  remark: string;
}

// ---------- 计算类型：分系统齐套状态 ----------
export interface SubsystemKitStatus {
  subsystemPartNo: string;
  subsystemName: string;
  totalUnits: number;
  completeUnits: number;
  /** 0-100 */
  rate: number;
  status: KitStatusType;
}

// ---------- 计算类型：项目总览指标 ----------
export interface ProjectMetrics {
  totalMaterials: number;
  /** 0-100 */
  kitRate: number;
  productionCount: number;
  aitWorkCount: number;
}

// ---------- v2 新增：Excel 导入相关类型 ----------

/** Excel 模板列定义 */
export interface ExcelColumn {
  /** 列序（A=0, B=1, ...） */
  index: number;
  /** 中文列名 */
  label: string;
  /** 对应字段名 */
  field: string;
  /** 是否必填 */
  required: boolean;
}

/** Excel 导入预览项（单行校验结果） */
export interface ExcelRowValidation {
  /** 行号（从 2 开始，1 为表头） */
  row: number;
  /** 料号 */
  partNo: string;
  /** 品名 */
  name: string;
  /** 是否有效 */
  valid: boolean;
  /** 错误信息（valid=false 时） */
  errors: string[];
}

/** 单个 sheet 的解析结果（对应一颗卫星） */
export interface ExcelSheetResult {
  /** sheet 名（= 卫星名） */
  sheetName: string;
  /** 解析出的卫星（解析成功时） */
  satellite: Satellite | null;
  /** 行校验结果列表 */
  rowValidations: ExcelRowValidation[];
  /** 物料总数 */
  totalRows: number;
  /** 有效行数 */
  validRows: number;
  /** 错误信息（解析失败时） */
  error: string | null;
}

/** Excel 导入总体结果 */
export interface ExcelImportResult {
  /** 是否成功 */
  success: boolean;
  /** 导入的卫星数量 */
  satelliteCount: number;
  /** 每个 sheet 的解析结果 */
  sheetResults: ExcelSheetResult[];
  /** 总物料数 */
  totalMaterials: number;
  /** 错误汇总 */
  errors: string[];
  /** 导入的项目 ID（导入到哪个项目） */
  projectId: string;
}

/** Excel 导入选项 */
export interface ExcelImportOptions {
  /** 导入策略：append=追加卫星，overwrite=覆盖项目 */
  strategy: 'append' | 'overwrite';
  /** 目标项目 ID */
  projectId: string;
  /** 是否跳过无效行 */
  skipInvalidRows: boolean;
}

// ---------- 服务接口（v2 扩展） ----------
export interface DataService {
  /** 获取原始 BOM JSON 树 */
  fetchBomTree(): Promise<RawBomNode>;
  /** 获取示例项目（作为种子数据） */
  fetchProject(): Promise<Project>;
  /** [v2] 获取所有项目列表（首次返回示例项目） */
  fetchProjects(): Promise<Project[]>;
  /** [v2] 创建新项目（空白） */
  createProject(params: {
    name: string;
    satelliteModel: string;
  }): Promise<Project>;
  /** [v2] 从示例数据创建项目（复制示例为种子） */
  createProjectFromExample(name: string): Promise<Project>;
  /** 获取预置 AIT 工作项（按卫星作用域） */
  fetchAitWorks(satellitePartNo?: string): Promise<AitWork[]>;
  /** 获取预置临时任务（按卫星作用域） */
  fetchTasks(satellitePartNo?: string): Promise<Task[]>;
}

// ---------- AIT 预置工作类型映射 ----------
export const AIT_WORK_PRESETS: Record<AitWorkType, string> = {
  assembly: '总装',
  electrical_test: '电测',
  thermal_test: '热试验',
  mechanical_test: '力学试验',
  noise_test: '噪声试验',
  emc_test: 'EMC试验',
  custom: '自定义',
};

// ---------- 阶段标签映射 ----------
export const PHASE_LABELS: Record<PhaseType, string> = {
  design: '设计阶段',
  production: '投产阶段',
  integration: '联试阶段',
  ait: 'AIT阶段',
};

// ---------- 投产状态标签映射 ----------
export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  not_started: '未投产',
  in_progress: '生产中',
  completed: '已完成',
};

// ---------- 阶段顺序（用于步骤条） ----------
export const PHASE_ORDER: PhaseType[] = [
  'design',
  'production',
  'integration',
  'ait',
];

// ---------- v2 导航标签映射（面包屑用） ----------
export const PAGE_LABELS: Record<string, string> = {
  overview: '总览',
  'project-management': '项目管理',
  tree: '层级数据',
  kitboard: 'BOM 齐套',
  phase: '阶段管理',
  ait: 'AIT 编排',
};
