export interface ColumnItem {
  tag: string;
  style: {
    flex: number;
  };
  elements: any[];
}

export interface ColumnSetData {
  columns?: ColumnItem[];
}
