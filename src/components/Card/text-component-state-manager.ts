// text-component-state-manager.ts - 文本组件状态管理器

// 文本组件状态接口
interface TextComponentState {
  userEditedContent?: string | any;
  boundVariableName?: string;
}

// 文本组件状态管理器类
class TextComponentStateManager {
  private static instance: TextComponentStateManager;
  private stateMap: Map<string, TextComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): TextComponentStateManager {
    if (!TextComponentStateManager.instance) {
      TextComponentStateManager.instance = new TextComponentStateManager();
    }
    return TextComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): TextComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的内容
  public setUserEditedContent(
    componentId: string,
    content: string | any,
  ): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedContent: content,
    });

    console.log('📝 设置用户编辑内容:', {
      componentId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取用户编辑的内容
  public getUserEditedContent(componentId: string): string | any | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedContent;
  }

  // 设置绑定的变量名
  public setBoundVariableName(
    componentId: string,
    variableName: string | undefined,
  ): void {
    const currentState = this.getComponentState(componentId);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundVariableName = variableName;
    } else {
      delete newState.boundVariableName;
    }

    this.stateMap.set(componentId, newState);

    console.log('🔗 设置绑定变量名:', {
      componentId,
      variableName,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
    console.log('🗑️ 清除组件状态:', {
      componentId,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取所有状态
  public getAllStates(): Map<string, TextComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserContent: number;
    componentsWithBoundVariables: number;
  } {
    let componentsWithUserContent = 0;
    let componentsWithBoundVariables = 0;

    this.stateMap.forEach((state) => {
      if (state.userEditedContent !== undefined) {
        componentsWithUserContent++;
      }
      if (state.boundVariableName) {
        componentsWithBoundVariables++;
      }
    });

    return {
      totalComponents: this.stateMap.size,
      componentsWithUserContent,
      componentsWithBoundVariables,
    };
  }
}

// 导出单例实例
export const textComponentStateManager =
  TextComponentStateManager.getInstance();

// 导出类型
export type { TextComponentState };
