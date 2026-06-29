// ============================================================
// src/types/index.ts — 全局类型定义
// 卫星制造项目管理系统（Demo）
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
/** 页面类型 */
export type PageType = 'overview' | 'tree' | 'kitboard' | 'phase' | 'ait';
/** 齐套筛选 */
export type KitFilter = 'all' | 'electrical' | 'qualification' | 'flight';

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

// ---------- 领域模型：项目/批次 ----------
export interface Project {
  id: string;
  /** 项目名称，如 "灵犀10B" */
  name: string;
  satelliteModel: string;
  satellite: Satellite;
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

// ---------- 服务接口 ----------
export interface DataService {
  fetchBomTree(): Promise<RawBomNode>;
  fetchProject(): Promise<Project>;
  fetchAitWorks(): Promise<AitWork[]>;
  fetchTasks(): Promise<Task[]>;
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
