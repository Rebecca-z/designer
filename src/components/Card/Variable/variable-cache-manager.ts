// variable-cache-manager.ts - 变量缓存管理器

import { VariableItem } from '../card-designer-types-updated';

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
    console.log('📦 设置变量到缓存:', {
      variableName,
      value,
      timestamp: new Date().toISOString(),
    });
    this.cache[variableName] = value;
  }

  // 从缓存获取变量值
  public getVariable(variableName: string): any {
    const value = this.cache[variableName];
    console.log('🔍 从缓存获取变量:', {
      variableName,
      value,
      found: value !== undefined,
      cacheKeys: Object.keys(this.cache),
    });
    return value;
  }

  // 批量设置变量到缓存
  public setVariables(variables: VariableItem[]): void {
    console.log('📦 批量设置变量到缓存:', {
      variablesCount: variables.length,
      variables: variables,
    });

    variables.forEach((variable) => {
      if (typeof variable === 'object' && variable !== null) {
        const variableRecord = variable as Record<string, any>;
        const keys = Object.keys(variableRecord);

        // 分离实际变量名和内部属性
        const actualVariableNames = keys.filter((key) => !key.startsWith('__'));
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
          console.log('📦 设置内部属性到缓存:', {
            internalKey,
            internalValue,
            timestamp: new Date().toISOString(),
          });
        });
      }
    });
  }

  // 获取所有缓存的变量
  public getAllVariables(): VariableCache {
    return { ...this.cache };
  }

  // 清除缓存
  public clearCache(): void {
    console.log('🗑️ 清除变量缓存');
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
