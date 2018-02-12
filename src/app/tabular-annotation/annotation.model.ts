export class Annotation {

  columnHeader: string;
  columnValuesType: string;

  // Relationship
  subject: string;
  property: string;

  // URI
  columnType: string;
  urifyNamespace: string;

  // Literal
  columnDatatype: string;
  langTag: string;

  constructor(obj?: any) {
    this.subject = obj && obj.subject || '';
    this.property = obj && obj.property || '';
    this.columnType = obj && obj.columnType || '';
    this.columnHeader = obj && obj.header || '';
    this.columnValuesType = obj && obj.columnValuesType || '';
    this.urifyNamespace = obj && obj.urifyNamespace || '';
    this.columnDatatype = obj && obj.columnDatatype || '';
    this.langTag = obj && obj.langTag || '';
  }
}
