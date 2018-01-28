export class Annotation {

  columnHeader: string;
  sourceColumnHeader: string;
  property: string;
  columnType: string;
  columnValuesType: string;
  urifyPrefix: string;

  constructor(obj?: any) {
    this.sourceColumnHeader = obj && obj.source || '';
    this.property = obj && obj.property || '';
    this.columnType = obj && obj.columnType || '';
    this.columnHeader = obj && obj.header || '';
    this.columnValuesType = obj && obj._columnDataType || '';
    this.urifyPrefix = obj && obj._urifyPrefix || '';
  }
}
