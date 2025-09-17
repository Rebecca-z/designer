// 组件状态管理 UI状态跟踪 跟随组件
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
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
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

// 图片组件状态接口
interface ImageComponentState {
  userEditedUrl?: string;
  boundVariableName?: string;
}

// 图片组件状态管理器类
class ImageComponentStateManager {
  private static instance: ImageComponentStateManager;
  private stateMap: Map<string, ImageComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): ImageComponentStateManager {
    if (!ImageComponentStateManager.instance) {
      ImageComponentStateManager.instance = new ImageComponentStateManager();
    }
    return ImageComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): ImageComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的URL
  public setUserEditedUrl(componentId: string, url: string): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedUrl: url,
    });
  }

  // 获取用户编辑的URL
  public getUserEditedUrl(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedUrl;
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
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
  }

  // 获取所有状态
  public getAllStates(): Map<string, ImageComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserUrl: number;
    componentsWithBoundVariables: number;
  } {
    let componentsWithUserUrl = 0;
    let componentsWithBoundVariables = 0;

    this.stateMap.forEach((state) => {
      if (state.userEditedUrl !== undefined) {
        componentsWithUserUrl++;
      }
      if (state.boundVariableName) {
        componentsWithBoundVariables++;
      }
    });

    return {
      totalComponents: this.stateMap.size,
      componentsWithUserUrl,
      componentsWithBoundVariables,
    };
  }
}

// 导出图片组件状态管理器单例实例
export const imageComponentStateManager =
  ImageComponentStateManager.getInstance();

// 导出图片组件状态类型
export type { ImageComponentState };

// 多图混排组件状态接口
interface MultiImageComponentState {
  userEditedImageList?: Array<{
    img_url: string;
    i18n_img_url?: { [key: string]: string };
  }>;
  boundVariableName?: string;
}

// 多图混排组件状态管理器类
class MultiImageComponentStateManager {
  private static instance: MultiImageComponentStateManager;
  private stateMap: Map<string, MultiImageComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): MultiImageComponentStateManager {
    if (!MultiImageComponentStateManager.instance) {
      MultiImageComponentStateManager.instance =
        new MultiImageComponentStateManager();
    }
    return MultiImageComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): MultiImageComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的图片列表
  public setUserEditedImageList(
    componentId: string,
    imageList: Array<{
      img_url: string;
      i18n_img_url?: { [key: string]: string };
    }>,
  ): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedImageList: imageList,
    });
  }

  // 获取用户编辑的图片列表
  public getUserEditedImageList(
    componentId: string,
  ):
    | Array<{ img_url: string; i18n_img_url?: { [key: string]: string } }>
    | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedImageList;
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
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
  }

  // 获取所有状态
  public getAllStates(): Map<string, MultiImageComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserImageList: number;
    componentsWithBoundVariables: number;
  } {
    let componentsWithUserImageList = 0;
    let componentsWithBoundVariables = 0;

    this.stateMap.forEach((state) => {
      if (state.userEditedImageList !== undefined) {
        componentsWithUserImageList++;
      }
      if (state.boundVariableName) {
        componentsWithBoundVariables++;
      }
    });

    return {
      totalComponents: this.stateMap.size,
      componentsWithUserImageList,
      componentsWithBoundVariables,
    };
  }
}

// 导出多图混排组件状态管理器单例实例
export const multiImageComponentStateManager =
  MultiImageComponentStateManager.getInstance();

// 导出多图混排组件状态类型
export type { MultiImageComponentState };

// 输入框组件状态接口
interface InputComponentState {
  userEditedPlaceholder?: string;
  boundPlaceholderVariableName?: string;
  userEditedDefaultValue?: string;
  boundDefaultValueVariableName?: string;
}

// 输入框组件状态管理器类
class InputComponentStateManager {
  private static instance: InputComponentStateManager;
  private stateMap: Map<string, InputComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): InputComponentStateManager {
    if (!InputComponentStateManager.instance) {
      InputComponentStateManager.instance = new InputComponentStateManager();
    }
    return InputComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): InputComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的占位文本
  public setUserEditedPlaceholder(
    componentId: string,
    placeholder: string,
  ): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedPlaceholder: placeholder,
    });
  }

  // 获取用户编辑的占位文本
  public getUserEditedPlaceholder(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedPlaceholder;
  }

  // 设置绑定的占位文本变量名
  public setBoundPlaceholderVariableName(
    componentId: string,
    variableName: string | undefined,
  ): void {
    const currentState = this.getComponentState(componentId);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundPlaceholderVariableName = variableName;
    } else {
      delete newState.boundPlaceholderVariableName;
    }

    this.stateMap.set(componentId, newState);
  }

  // 获取绑定的占位文本变量名
  public getBoundPlaceholderVariableName(
    componentId: string,
  ): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundPlaceholderVariableName;
  }

  // 设置用户编辑的默认值
  public setUserEditedDefaultValue(
    componentId: string,
    defaultValue: string,
  ): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedDefaultValue: defaultValue,
    });
  }

  // 获取用户编辑的默认值
  public getUserEditedDefaultValue(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedDefaultValue;
  }

  // 设置绑定的默认值变量名
  public setBoundDefaultValueVariableName(
    componentId: string,
    variableName: string | undefined,
  ): void {
    const currentState = this.getComponentState(componentId);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundDefaultValueVariableName = variableName;
    } else {
      delete newState.boundDefaultValueVariableName;
    }

    this.stateMap.set(componentId, newState);
  }

  // 获取绑定的默认值变量名
  public getBoundDefaultValueVariableName(
    componentId: string,
  ): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundDefaultValueVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
  }

  // 获取所有状态
  public getAllStates(): Map<string, InputComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserPlaceholder: number;
    componentsWithBoundPlaceholder: number;
    componentsWithUserDefaultValue: number;
    componentsWithBoundDefaultValue: number;
  } {
    let componentsWithUserPlaceholder = 0;
    let componentsWithBoundPlaceholder = 0;
    let componentsWithUserDefaultValue = 0;
    let componentsWithBoundDefaultValue = 0;

    this.stateMap.forEach((state) => {
      if (state.userEditedPlaceholder !== undefined) {
        componentsWithUserPlaceholder++;
      }
      if (state.boundPlaceholderVariableName) {
        componentsWithBoundPlaceholder++;
      }
      if (state.userEditedDefaultValue !== undefined) {
        componentsWithUserDefaultValue++;
      }
      if (state.boundDefaultValueVariableName) {
        componentsWithBoundDefaultValue++;
      }
    });

    return {
      totalComponents: this.stateMap.size,
      componentsWithUserPlaceholder,
      componentsWithBoundPlaceholder,
      componentsWithUserDefaultValue,
      componentsWithBoundDefaultValue,
    };
  }
}

// 导出输入框组件状态管理器单例实例
export const inputComponentStateManager =
  InputComponentStateManager.getInstance();

// 导出输入框组件状态类型
export type { InputComponentState };

// ==================== 下拉单选组件状态管理 ====================

// 下拉单选组件状态接口
export interface SelectComponentState {
  userEditedOptions?: Array<{ label: string; value: string }>; // 用户编辑的选项列表
  boundVariableName?: string; // 绑定的变量名
}

// 下拉单选组件状态管理器
export class SelectComponentStateManager {
  private static instance: SelectComponentStateManager;
  private stateMap: Map<string, SelectComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): SelectComponentStateManager {
    if (!SelectComponentStateManager.instance) {
      SelectComponentStateManager.instance = new SelectComponentStateManager();
    }
    return SelectComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): SelectComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的选项列表
  public setUserEditedOptions(
    componentId: string,
    options: Array<{ label: string; value: string }>,
  ): void {
    console.warn('setUserEditedOptions', options);
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedOptions: options,
    });
  }

  // 获取用户编辑的选项列表
  public getUserEditedOptions(
    componentId: string,
  ): Array<{ label: string; value: string }> | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedOptions;
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
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
  }

  // 获取所有状态（调试用）
  public getAllStates(): Map<string, SelectComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息（调试用）
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserOptions: number;
    componentsWithBoundVariables: number;
  } {
    const states = Array.from(this.stateMap.values());
    return {
      totalComponents: states.length,
      componentsWithUserOptions: states.filter((s) => s.userEditedOptions)
        .length,
      componentsWithBoundVariables: states.filter((s) => s.boundVariableName)
        .length,
    };
  }
}

// 导出下拉单选组件状态管理器实例
export const selectComponentStateManager =
  SelectComponentStateManager.getInstance();

// 下拉多选组件状态接口
interface MultiSelectComponentState {
  userEditedOptions?: Array<{ label: string; value: string }>; // 用户编辑的选项列表
  boundVariableName?: string; // 绑定的变量名
}

// 下拉多选组件状态管理器
export class MultiSelectComponentStateManager {
  private static instance: MultiSelectComponentStateManager;
  private stateMap: Map<string, MultiSelectComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): MultiSelectComponentStateManager {
    if (!MultiSelectComponentStateManager.instance) {
      MultiSelectComponentStateManager.instance =
        new MultiSelectComponentStateManager();
    }
    return MultiSelectComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): MultiSelectComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的选项列表
  public setUserEditedOptions(
    componentId: string,
    options: Array<{ label: string; value: string }>,
  ): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedOptions: options,
    });
  }

  // 获取用户编辑的选项列表
  public getUserEditedOptions(
    componentId: string,
  ): Array<{ label: string; value: string }> | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedOptions;
  }

  // 设置绑定的变量名
  public setBoundVariableName(componentId: string, variableName: string): void {
    const currentState = this.getComponentState(componentId);
    const newState = {
      ...currentState,
      boundVariableName: variableName,
    };

    // 如果变量名为空，清除绑定状态
    if (!variableName) {
      delete newState?.boundVariableName;
    }

    this.stateMap.set(componentId, newState);
  }

  // 获取绑定的变量名
  public getBoundVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
  }

  // 获取所有组件状态（调试用）
  public getAllStates(): Map<string, MultiSelectComponentState> {
    return new Map(this.stateMap);
  }
}

// 导出下拉多选组件状态管理器实例
export const multiSelectComponentStateManager =
  MultiSelectComponentStateManager.getInstance();

// 导出下拉多选组件状态类型
export type { MultiSelectComponentState };

// ==================== 选项编辑状态管理 ====================

// 选项编辑状态接口
interface OptionEditState {
  userEditedTextContent?: string; // 用户编辑的选项文本内容
  boundTextVariableName?: string; // 绑定的文本变量名
  userEditedValue?: string; // 用户编辑的回传参数
  boundValueVariableName?: string; // 绑定的回传参数变量名
}

// 选项编辑状态管理器
export class OptionEditStateManager {
  private static instance: OptionEditStateManager;
  private stateMap: Map<string, OptionEditState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): OptionEditStateManager {
    if (!OptionEditStateManager.instance) {
      OptionEditStateManager.instance = new OptionEditStateManager();
    }
    return OptionEditStateManager.instance;
  }

  // 生成选项的唯一键
  private getOptionKey(componentId: string, optionIndex: number): string {
    return `${componentId}_option_${optionIndex}`;
  }

  // 获取选项状态
  public getOptionState(
    componentId: string,
    optionIndex: number,
  ): OptionEditState {
    const key = this.getOptionKey(componentId, optionIndex);
    return this.stateMap.get(key) || {};
  }

  // 设置用户编辑的文本内容
  public setUserEditedTextContent(
    componentId: string,
    optionIndex: number,
    content: string,
  ): void {
    const key = this.getOptionKey(componentId, optionIndex);
    const currentState = this.getOptionState(componentId, optionIndex);
    this.stateMap.set(key, {
      ...currentState,
      userEditedTextContent: content,
    });
  }

  // 获取用户编辑的文本内容
  public getUserEditedTextContent(
    componentId: string,
    optionIndex: number,
  ): string | undefined {
    const state = this.getOptionState(componentId, optionIndex);
    return state.userEditedTextContent;
  }

  // 设置绑定的文本变量名
  public setBoundTextVariableName(
    componentId: string,
    optionIndex: number,
    variableName: string | undefined,
  ): void {
    const key = this.getOptionKey(componentId, optionIndex);
    const currentState = this.getOptionState(componentId, optionIndex);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundTextVariableName = variableName;
    } else {
      delete newState.boundTextVariableName;
    }

    this.stateMap.set(key, newState);
  }

  // 获取绑定的文本变量名
  public getBoundTextVariableName(
    componentId: string,
    optionIndex: number,
  ): string | undefined {
    const state = this.getOptionState(componentId, optionIndex);
    return state.boundTextVariableName;
  }

  // 设置用户编辑的回传参数
  public setUserEditedValue(
    componentId: string,
    optionIndex: number,
    value: string,
  ): void {
    const key = this.getOptionKey(componentId, optionIndex);
    const currentState = this.getOptionState(componentId, optionIndex);
    this.stateMap.set(key, {
      ...currentState,
      userEditedValue: value,
    });
  }

  // 获取用户编辑的回传参数
  public getUserEditedValue(
    componentId: string,
    optionIndex: number,
  ): string | undefined {
    const state = this.getOptionState(componentId, optionIndex);
    return state.userEditedValue;
  }

  // 设置绑定的回传参数变量名
  public setBoundValueVariableName(
    componentId: string,
    optionIndex: number,
    variableName: string | undefined,
  ): void {
    const key = this.getOptionKey(componentId, optionIndex);
    const currentState = this.getOptionState(componentId, optionIndex);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundValueVariableName = variableName;
    } else {
      delete newState.boundValueVariableName;
    }

    this.stateMap.set(key, newState);
  }

  // 获取绑定的回传参数变量名
  public getBoundValueVariableName(
    componentId: string,
    optionIndex: number,
  ): string | undefined {
    const state = this.getOptionState(componentId, optionIndex);
    return state.boundValueVariableName;
  }

  // 清除选项状态
  public clearOptionState(componentId: string, optionIndex: number): void {
    const key = this.getOptionKey(componentId, optionIndex);
    this.stateMap.delete(key);
  }

  // 清除组件的所有选项状态
  public clearComponentOptionStates(componentId: string): void {
    const keysToDelete = Array.from(this.stateMap.keys()).filter((key) =>
      key.startsWith(`${componentId}_option_`),
    );
    keysToDelete.forEach((key) => this.stateMap.delete(key));
  }

  // 获取所有状态
  public getAllStates(): Map<string, OptionEditState> {
    return new Map(this.stateMap);
  }
}

// 导出选项编辑状态管理器单例实例
export const optionEditStateManager = OptionEditStateManager.getInstance();

// 导出选项编辑状态类型
export type { OptionEditState };

// 标题组件状态接口
interface TitleComponentState {
  userEditedTitle?: string;
  boundTitleVariableName?: string;
  userEditedSubtitle?: string;
  boundSubtitleVariableName?: string;
}

// 标题组件状态管理器类
class TitleComponentStateManager {
  private static instance: TitleComponentStateManager;
  private stateMap: Map<string, TitleComponentState> = new Map();

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): TitleComponentStateManager {
    if (!TitleComponentStateManager.instance) {
      TitleComponentStateManager.instance = new TitleComponentStateManager();
    }
    return TitleComponentStateManager.instance;
  }

  // 获取组件状态
  public getComponentState(componentId: string): TitleComponentState {
    return this.stateMap.get(componentId) || {};
  }

  // 设置用户编辑的标题
  public setUserEditedTitle(componentId: string, title: string): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedTitle: title,
    });

    console.log('📝 设置用户编辑标题:', {
      componentId,
      title,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取用户编辑的标题
  public getUserEditedTitle(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedTitle;
  }

  // 设置绑定的标题变量名
  public setBoundTitleVariableName(
    componentId: string,
    variableName: string | undefined,
  ): void {
    const currentState = this.getComponentState(componentId);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundTitleVariableName = variableName;
    } else {
      delete newState.boundTitleVariableName;
    }

    this.stateMap.set(componentId, newState);

    console.log('🔗 设置标题绑定变量名:', {
      componentId,
      variableName,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取绑定的标题变量名
  public getBoundTitleVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundTitleVariableName;
  }

  // 设置用户编辑的副标题
  public setUserEditedSubtitle(componentId: string, subtitle: string): void {
    const currentState = this.getComponentState(componentId);
    this.stateMap.set(componentId, {
      ...currentState,
      userEditedSubtitle: subtitle,
    });

    console.log('📝 设置用户编辑副标题:', {
      componentId,
      subtitle,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取用户编辑的副标题
  public getUserEditedSubtitle(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.userEditedSubtitle;
  }

  // 设置绑定的副标题变量名
  public setBoundSubtitleVariableName(
    componentId: string,
    variableName: string | undefined,
  ): void {
    const currentState = this.getComponentState(componentId);
    const newState = { ...currentState };

    if (variableName) {
      newState.boundSubtitleVariableName = variableName;
    } else {
      delete newState.boundSubtitleVariableName;
    }

    this.stateMap.set(componentId, newState);

    console.log('🔗 设置副标题绑定变量名:', {
      componentId,
      variableName,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取绑定的副标题变量名
  public getBoundSubtitleVariableName(componentId: string): string | undefined {
    const state = this.getComponentState(componentId);
    return state.boundSubtitleVariableName;
  }

  // 清除组件状态
  public clearComponentState(componentId: string): void {
    this.stateMap.delete(componentId);
    console.log('🗑️ 清除标题组件状态:', {
      componentId,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取所有状态
  public getAllStates(): Map<string, TitleComponentState> {
    return new Map(this.stateMap);
  }

  // 获取状态统计信息
  public getStateStats(): {
    totalComponents: number;
    componentsWithUserTitle: number;
    componentsWithBoundTitle: number;
    componentsWithUserSubtitle: number;
    componentsWithBoundSubtitle: number;
  } {
    let componentsWithUserTitle = 0;
    let componentsWithBoundTitle = 0;
    let componentsWithUserSubtitle = 0;
    let componentsWithBoundSubtitle = 0;

    this.stateMap.forEach((state) => {
      if (state.userEditedTitle !== undefined) {
        componentsWithUserTitle++;
      }
      if (state.boundTitleVariableName) {
        componentsWithBoundTitle++;
      }
      if (state.userEditedSubtitle !== undefined) {
        componentsWithUserSubtitle++;
      }
      if (state.boundSubtitleVariableName) {
        componentsWithBoundSubtitle++;
      }
    });

    return {
      totalComponents: this.stateMap.size,
      componentsWithUserTitle,
      componentsWithBoundTitle,
      componentsWithUserSubtitle,
      componentsWithBoundSubtitle,
    };
  }
}

// 导出标题组件状态管理器单例实例
export const titleComponentStateManager =
  TitleComponentStateManager.getInstance();

// 导出标题组件状态类型
export type { TitleComponentState };
