export interface EventItem {
  id: number;
  actionType: string;
  actionText: string;
  behavior: any;
}

export interface Parameter {
  id: number;
  param1: string;
  param2: string;
}

export interface FormData {
  pcUrl: string;
  mobileUrl: string;
  paramType: 'object' | 'string';
}
