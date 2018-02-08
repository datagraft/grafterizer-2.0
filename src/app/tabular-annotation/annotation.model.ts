export class Annotation {

  columnHeader: string;
  columnValuesType: string;

  // Relationship
  subject: string;
  property: string;

  // URI
  columnType: string;
  urifyPrefix: string;

  // Literal
  columnDatatype: string;
  langTag: string;

  constructor(obj?: any) {
    this.subject = obj && obj.subject || '';
    this.property = obj && obj.property || '';
    this.columnType = obj && obj.columnType || '';
    this.columnHeader = obj && obj.header || '';
    this.columnValuesType = obj && obj._columnValuesType || '';
    this.urifyPrefix = obj && obj._urifyPrefix || '';
    this.columnDatatype = obj && obj._columnDatatype || '';
    this.langTag = obj && obj._columnDatatype || '';
  }
}
