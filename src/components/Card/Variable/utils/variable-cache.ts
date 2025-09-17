// 全局变量缓存 数据快速访问 跟随全局变量

import { VariableItem } from '../../type';

// 变量缓存接口
interface VariableCache {
  [variableName: string]: any;
}

// 变量缓存管理器类
class VariableCacheManager {
  private static instance: VariableCacheManager;
  private cache: VariableCache = {};

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): VariableCacheManager {
    if (!VariableCacheManager.instance) {
      VariableCacheManager.instance = new VariableCacheManager();
    }
    return VariableCacheManager.instance;
  }

  // 设置变量到缓存
  public setVariable(variableName: string, value: any): void {
    this.cache[variableName] = value;
  }

  // 从缓存获取变量值
  public getVariable(variableName: string): any {
    const value = this.cache[variableName];
    return value;
  }

  // 批量设置变量到缓存
  public setVariables(variables: VariableItem[]): void {
    variables?.forEach((variable) => {
      if (typeof variable === 'object' && variable !== null) {
        // 检查是否是标准的Variable对象格式 {name, type, value, originalType, description}
        const varRecord = variable as any;
        if (varRecord.name && varRecord.value !== undefined) {
          // 标准Variable对象：直接保存变量名和值
          this.setVariable(varRecord.name, varRecord.value);
          // 如果有 originalType，也需要保存到缓存中以便后续恢复
          if (varRecord.originalType) {
            const originalTypeKey = `__${varRecord.name}_originalType`;
            this.setVariable(originalTypeKey, varRecord.originalType);
          }
        } else {
          // 自定义格式：{变量名: 模拟数据值, __变量名_originalType: 原始类型}
          const variableRecord = variable as Record<string, any>;
          const keys = Object.keys(variableRecord);

          // 分离实际变量名和内部属性
          const actualVariableNames = keys.filter(
            (key) => !key.startsWith('__'),
          );
          const internalKeys = keys.filter((key) => key.startsWith('__'));

          // 保存实际变量
          actualVariableNames.forEach((variableName) => {
            const variableValue = variableRecord[variableName];
            this.setVariable(variableName, variableValue);
          });

          // 保存内部属性（如 originalType）
          internalKeys.forEach((internalKey) => {
            const internalValue = variableRecord[internalKey];
            this.setVariable(internalKey, internalValue);
          });
        }
      }
    });
  }

  // 获取所有缓存的变量
  public getAllVariables(): VariableCache {
    return this.cache;
  }

  // 清除缓存
  public clearCache(): void {
    this.cache = {};
  }

  // 检查变量是否存在
  public hasVariable(variableName: string): boolean {
    return variableName in this.cache;
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    totalVariables: number;
    variableNames: string[];
  } {
    return {
      totalVariables: Object.keys(this.cache).length,
      variableNames: Object.keys(this.cache),
    };
  }
}

// 导出单例实例
export const variableCacheManager = VariableCacheManager.getInstance();

// 导出类型
export type { VariableCache };
