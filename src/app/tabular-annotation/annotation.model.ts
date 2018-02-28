export class Annotation {

  columnHeader: string;
  columnValuesType: string;

  // Relationship
  subject: string;
  property: string;
  propertyNamespace: string; // auto-filled based on the vocabularies
  propertyPrefix: string; // auto-filled based on the vocabularies

  // URI
  columnType: string;
  columnTypeNamespace: string; // auto-filled based on the vocabularies
  columnTypePrefix: string; // auto-filled based on the vocabularies
  urifyNamespace: string;
  urifyPrefix: string; // auto-filled based on the vocabularies

  // Literal
  columnDatatype: string;
  columnDatatypePrefix: string; // auto-filled based on the vocabularies
  columnDatatypeNamespace: string; // auto-filled based on the vocabularies
  langTag: string;

  // Helper
  isSubject: boolean;

  constructor(obj?: any) {
    this.subject = obj && obj.subject || '';
    this.property = obj && obj.property || '';
    this.propertyPrefix = obj && obj.propertyPrefix || '';
    this.propertyNamespace = obj && obj.propertyNamespace || '';
    this.columnType = obj && obj.columnType || '';
    this.columnTypePrefix = obj && obj.columnTypePrefix || '';
    this.columnTypeNamespace = obj && obj.columnTypeNamespace || '';
    this.columnHeader = obj && obj.header || '';
    this.columnValuesType = obj && obj.columnValuesType || '';
    this.urifyPrefix = obj && obj.urifyPrefix || '';
    this.urifyNamespace = obj && obj.urifyNamespace || '';
    this.columnDatatype = obj && obj.columnDatatype || '';
    this.columnDatatypeNamespace = obj && obj.columnDatatypeNamespace || '';
    this.columnDatatypePrefix = obj && obj.columnDatatypePrefix || '';
    this.langTag = obj && obj.langTag || '';
    this.isSubject = obj && obj.isSubject || '';
  }
}
