// ============================================================
// src/services/ExcelService.ts — Excel 导入/导出服务（v2 新增）
// 基于 SheetJS (xlsx) 社区版，纯前端读写
// ============================================================

import * as XLSX from 'xlsx';
import type {
  ExcelColumn,
  ExcelImportResult,
  ExcelImportOptions,
  ExcelRowValidation,
  ExcelSheetResult,
  Project,
  Satellite,
  Subsystem,
  Unit,
  UnitType,
  ProductionStatus,
} from '@/types';
import { PRODUCTION_STATUS_LABELS } from '@/types';

/** Excel 模板固定列定义（17 列） */
export const EXCEL_COLUMNS: ExcelColumn[] = [
  { index: 0,  label: '层级',         field: 'level',             required: true  },
  { index: 1,  label: '料号',         field: 'part_no',           required: true  },
  { index: 2,  label: '品名',         field: 'name',              required: true  },
  { index: 3,  label: '规格',         field: 'spec',              required: false },
  { index: 4,  label: '封装形式',     field: 'form',              required: false },
  { index: 5,  label: '厂家',         field: 'manufacturer',      required: false },
  { index: 6,  label: '质量等级',     field: 'quality_level',     required: false },
  { index: 7,  label: '用量',         field: 'quantity',          required: false },
  { index: 8,  label: '位号',         field: 'location',          required: false },
  { index: 9,  label: '单位',         field: 'unit',              required: false },
  { index: 10, label: '类型',         field: 'type',              required: false },
  { index: 11, label: '电性件齐套',   field: 'electrical',        required: false },
  { index: 12, label: '鉴定件齐套',   field: 'qualification',     required: false },
  { index: 13, label: '正样件齐套',   field: 'flight',            required: false },
  { index: 14, label: '在整星中',     field: 'in_satellite',      required: false },
  { index: 15, label: '投产状态',     field: 'production_status', required: false },
  { index: 16, label: '交付日期',     field: 'delivery_date',     required: false },
];

/** 表头行（中文列名） */
const EXCEL_HEADER: string[] = EXCEL_COLUMNS.map((c) => c.label);

/** 将布尔值转为"是"/"否" */
function boolToText(val: boolean): string {
  return val ? '是' : '否';
}

/** 将"是"/"否"文本转为布尔值 */
function textToBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.trim() === '是' || val.trim().toLowerCase() === 'true' || val.trim() === '1';
  }
  return false;
}

/** 将投产状态标签转为枚举 */
function textToProductionStatus(val: unknown): ProductionStatus {
  if (typeof val !== 'string') return 'not_started';
  const trimmed = val.trim();
  for (const [key, label] of Object.entries(PRODUCTION_STATUS_LABELS)) {
    if (trimmed === label || trimmed === key) {
      return key as ProductionStatus;
    }
  }
  return 'not_started';
}

/** 从料号推断类型 */
function inferType(partNo: string, explicit?: string): UnitType {
  if (explicit) {
    const t = explicit.trim();
    if (t === '单机' || t === 'equipment' || t === 'EQ') return 'equipment';
    if (t === '零部件' || t === 'part' || t === 'PT') return 'part';
  }
  if (partNo.startsWith('EQ')) return 'equipment';
  if (partNo.startsWith('PT')) return 'part';
  return 'equipment';
}

/**
 * 将 Satellite 层级树扁平化为 Excel 行数组。
 */
export function flattenSatelliteToRows(
  satellite: Satellite,
): Record<string, string | number>[] {
  const rows: Record<string, string | number>[] = [];

  // level 1: 整星
  rows.push({
    '层级': 1,
    '料号': satellite.partNo,
    '品名': satellite.name,
    '规格': '',
    '封装形式': '',
    '厂家': satellite.manufacturer,
    '质量等级': '',
    '用量': 1,
    '位号': '',
    '单位': '',
    '类型': '',
    '电性件齐套': '',
    '鉴定件齐套': '',
    '正样件齐套': '',
    '在整星中': '',
    '投产状态': '',
    '交付日期': '',
  });

  for (const sub of satellite.subsystems) {
    // level 2: 分系统
    rows.push({
      '层级': 2,
      '料号': sub.partNo,
      '品名': sub.name,
      '规格': '',
      '封装形式': '',
      '厂家': '',
      '质量等级': '',
      '用量': 1,
      '位号': '',
      '单位': '',
      '类型': '',
      '电性件齐套': '',
      '鉴定件齐套': '',
      '正样件齐套': '',
      '在整星中': '',
      '投产状态': '',
      '交付日期': '',
    });

    for (const unit of sub.units) {
      // level 3: 单机/零部件
      rows.push({
        '层级': 3,
        '料号': unit.partNo,
        '品名': unit.name,
        '规格': unit.spec,
        '封装形式': unit.form,
        '厂家': unit.manufacturer,
        '质量等级': unit.qualityLevel,
        '用量': unit.quantity,
        '位号': unit.location,
        '单位': unit.unit,
        '类型': unit.type === 'equipment' ? '单机' : '零部件',
        '电性件齐套': boolToText(unit.status.electrical),
        '鉴定件齐套': boolToText(unit.status.qualification),
        '正样件齐套': boolToText(unit.status.flight),
        '在整星中': unit.inSatellite.join(','),
        '投产状态': PRODUCTION_STATUS_LABELS[unit.productionStatus],
        '交付日期': unit.deliveryDate ?? '',
      });
    }
  }

  return rows;
}

/**
 * 将扁平行数据重建为层级树（Satellite）。
 * 采用 level 栈推断：level 1=整星, level 2=分系统, level 3=单机/零部件
 */
export function buildHierarchy(
  rows: Record<string, unknown>[],
  satelliteName: string,
): Satellite {
  // 找到整星行（level 1）
  const satRow = rows.find((r) => Number(r['层级']) === 1);
  const satPartNo = String(satRow?.['料号'] ?? `ST-${Date.now()}`);
  const satName = String(satRow?.['品名'] ?? satelliteName);
  const satManufacturer = String(satRow?.['厂家'] ?? '');

  // 收集分系统（level 2）
  const subsystems: Subsystem[] = [];
  let currentSub: Subsystem | null = null;

  for (const row of rows) {
    const level = Number(row['层级']);
    if (level === 1) continue; // 整星行跳过

    if (level === 2) {
      currentSub = {
        partNo: String(row['料号'] ?? ''),
        name: String(row['品名'] ?? ''),
        units: [],
      };
      subsystems.push(currentSub);
    } else if (level >= 3 && currentSub) {
      const partNo = String(row['料号'] ?? '');
      if (!partNo) continue;

      const typeStr = row['类型'] !== undefined ? String(row['类型']) : undefined;
      const type = inferType(partNo, typeStr);
      const isEquipment = type === 'equipment';

      const unit: Unit = {
        partNo,
        name: String(row['品名'] ?? ''),
        spec: String(row['规格'] ?? ''),
        manufacturer: String(row['厂家'] ?? ''),
        qualityLevel: String(row['质量等级'] ?? ''),
        form: String(row['封装形式'] ?? ''),
        quantity: parseInt(String(row['用量'] ?? '1'), 10) || 1,
        location: String(row['位号'] ?? ''),
        unit: String(row['单位'] ?? ''),
        type,
        status: isEquipment
          ? {
              electrical: textToBool(row['电性件齐套']),
              qualification: textToBool(row['鉴定件齐套']),
              flight: textToBool(row['正样件齐套']),
            }
          : { electrical: false, qualification: false, flight: false },
        inSatellite: String(row['在整星中'] ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isKitComplete: isEquipment
          ? textToBool(row['电性件齐套']) &&
            textToBool(row['鉴定件齐套']) &&
            textToBool(row['正样件齐套'])
          : false,
        productionStatus: isEquipment
          ? textToProductionStatus(row['投产状态'])
          : 'not_started',
        deliveryDate: isEquipment
          ? (String(row['交付日期'] ?? '').trim() || null)
          : null,
      };
      currentSub.units.push(unit);
    }
  }

  return {
    partNo: satPartNo,
    name: satName,
    manufacturer: satManufacturer,
    subsystems,
  };
}

/**
 * 校验单行数据。
 */
function validateRow(
  row: Record<string, unknown>,
  rowIndex: number,
): ExcelRowValidation {
  const errors: string[] = [];
  const partNo = String(row['料号'] ?? '').trim();
  const name = String(row['品名'] ?? '').trim();
  const level = Number(row['层级']);

  if (!partNo) errors.push('料号为空');
  if (!name) errors.push('品名为空');
  if (!level || level < 1 || level > 4) errors.push(`层级无效(${level})`);

  return {
    row: rowIndex,
    partNo,
    name,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 解析 Excel 文件，返回导入预览结果。
 */
export async function parseExcel(
  file: File,
  options?: ExcelImportOptions,
): Promise<ExcelImportResult> {
  const projectId = options?.projectId ?? '';
  const skipInvalid = options?.skipInvalidRows ?? true;
  const errors: string[] = [];
  const sheetResults: ExcelSheetResult[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    for (const sheetName of workbook.SheetNames) {
      // 跳过 _ 前缀 sheet（说明 sheet）
      if (sheetName.startsWith('_')) continue;

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });

      if (rows.length === 0) {
        sheetResults.push({
          sheetName,
          satellite: null,
          rowValidations: [],
          totalRows: 0,
          validRows: 0,
          error: 'sheet 无数据行',
        });
        errors.push(`sheet "${sheetName}" 无数据行`);
        continue;
      }

      // 校验每行
      const rowValidations: ExcelRowValidation[] = rows.map((row, idx) =>
        validateRow(row, idx + 2),
      );

      const validRows = skipInvalid
        ? rows.filter((_, idx) => rowValidations[idx].valid)
        : rows;

      const allValid = rowValidations.every((v) => v.valid);
      if (!allValid && !skipInvalid) {
        sheetResults.push({
          sheetName,
          satellite: null,
          rowValidations,
          totalRows: rows.length,
          validRows: rowValidations.filter((v) => v.valid).length,
          error: '存在无效行且未启用跳过无效行选项',
        });
        errors.push(`sheet "${sheetName}" 存在无效行`);
        continue;
      }

      try {
        const satellite = buildHierarchy(validRows, sheetName);
        sheetResults.push({
          sheetName,
          satellite,
          rowValidations,
          totalRows: rows.length,
          validRows: rowValidations.filter((v) => v.valid).length,
          error: null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '层级构建失败';
        sheetResults.push({
          sheetName,
          satellite: null,
          rowValidations,
          totalRows: rows.length,
          validRows: 0,
          error: msg,
        });
        errors.push(`sheet "${sheetName}" 构建失败: ${msg}`);
      }
    }

    const validSatellites = sheetResults
      .filter((r) => r.satellite !== null)
      .map((r) => r.satellite as Satellite);
    const totalMaterials = validSatellites.reduce(
      (sum, sat) =>
        sum + sat.subsystems.reduce((s, sub) => s + sub.units.length, 0),
      0,
    );

    return {
      success: validSatellites.length > 0,
      satelliteCount: validSatellites.length,
      sheetResults,
      totalMaterials,
      errors,
      projectId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Excel 解析失败';
    return {
      success: false,
      satelliteCount: 0,
      sheetResults: [],
      totalMaterials: 0,
      errors: [msg],
      projectId,
    };
  }
}

/**
 * 从导入结果中提取有效卫星列表。
 */
export function extractSatellites(result: ExcelImportResult): Satellite[] {
  return result.sheetResults
    .filter((r) => r.satellite !== null)
    .map((r) => r.satellite as Satellite);
}

/**
 * 下载空白模板（含 _说明 sheet + 示例 sheet）。
 */
export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();

  // 说明 sheet
  const guideRows = [
    { 说明: '每个 sheet 对应一颗卫星，sheet 名 = 卫星名' },
    { 说明: '层级：1=整星, 2=分系统, 3=单机/零部件' },
    { 说明: '料号、品名、层级为必填项' },
    { 说明: '类型可留空，系统按料号前缀推断（EQ=单机, PT=零部件）' },
    { 说明: '电性件/鉴定件/正样件齐套填"是"或"否"' },
    { 说明: '投产状态填"未投产"或"生产中"或"已完成"' },
    { 说明: '交付日期格式：YYYY-MM-DD' },
    { 说明: '第一个 sheet 必须是卫星 BOM 数据（说明 sheet 用 _ 前缀）' },
  ];
  const guideWs = XLSX.utils.json_to_sheet(guideRows);
  XLSX.utils.book_append_sheet(wb, guideWs, '_说明');

  // 示例 sheet
  const sampleRows: Record<string, string | number>[] = [
    {
      '层级': 1, '料号': 'ST01-001', '品名': '示例卫星', '规格': '', '封装形式': '',
      '厂家': '示例厂商', '质量等级': '', '用量': 1, '位号': '', '单位': '',
      '类型': '', '电性件齐套': '', '鉴定件齐套': '', '正样件齐套': '',
      '在整星中': '', '投产状态': '', '交付日期': '',
    },
    {
      '层级': 2, '料号': 'SB01-001', '品名': '示例分系统', '规格': '', '封装形式': '',
      '厂家': '', '质量等级': '', '用量': 1, '位号': '', '单位': '',
      '类型': '', '电性件齐套': '', '鉴定件齐套': '', '正样件齐套': '',
      '在整星中': '', '投产状态': '', '交付日期': '',
    },
    {
      '层级': 3, '料号': 'EQ01-001', '品名': '示例单机', '规格': '规格A', '封装形式': 'BGA',
      '厂家': '厂商A', '质量等级': 'A级', '用量': 1, '位号': 'U1', '单位': '台',
      '类型': '单机', '电性件齐套': '是', '鉴定件齐套': '否', '正样件齐套': '是',
      '在整星中': 'flight', '投产状态': '生产中', '交付日期': '2026-08-01',
    },
  ];
  const templateWs = XLSX.utils.json_to_sheet(sampleRows, {
    header: EXCEL_HEADER,
  });
  XLSX.utils.book_append_sheet(wb, templateWs, '卫星A');

  XLSX.writeFile(wb, '卫星BOM导入模板.xlsx');
}

/**
 * 将项目导出为多 sheet Excel。
 */
export function downloadProjectExcel(project: Project): void {
  const wb = XLSX.utils.book_new();

  for (const satellite of project.satellites) {
    const rows = flattenSatelliteToRows(satellite);
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: EXCEL_HEADER,
    });
    // sheet 名最长 31 字符
    const sheetName = satellite.name.substring(0, 31) || satellite.partNo;
    // 确保 sheet 名唯一
    let uniqueName = sheetName;
    let suffix = 2;
    while (wb.SheetNames.includes(uniqueName)) {
      uniqueName = `${sheetName}_${suffix}`.substring(0, 31);
      suffix++;
    }
    XLSX.utils.book_append_sheet(wb, ws, uniqueName);
  }

  // 如果项目无卫星，添加一个空 sheet 避免空文件
  if (project.satellites.length === 0) {
    const ws = XLSX.utils.json_to_sheet(
      [{ 说明: '该项目暂无卫星数据' }],
    );
    XLSX.utils.book_append_sheet(wb, ws, '_说明');
  }

  XLSX.writeFile(wb, `${project.name}_BOM.xlsx`);
}

export default {
  EXCEL_COLUMNS,
  parseExcel,
  extractSatellites,
  downloadTemplate,
  downloadProjectExcel,
  flattenSatelliteToRows,
  buildHierarchy,
};
