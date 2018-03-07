export const ColumnTypes = {
  URI: 'URI' as 'URI',
  Literal: 'Literal' as 'Literal',
};

export const XSDDatatypes = {
  'byte': 'https://www.w3.org/2001/XMLSchema#byte',
  'short': 'https://www.w3.org/2001/XMLSchema#short',
  'integer': 'https://www.w3.org/2001/XMLSchema#int',
  'long': 'https://www.w3.org/2001/XMLSchema#integer',
  'decimal': 'https://www.w3.org/2001/XMLSchema#decimal',
  'float': 'https://www.w3.org/2001/XMLSchema#float',
  'double': 'https://www.w3.org/2001/XMLSchema#double',
  'boolean': 'https://www.w3.org/2001/XMLSchema#boolean',
  'date': 'https://www.w3.org/2001/XMLSchema#dateTime',
  'string': 'https://www.w3.org/2001/XMLSchema#string',
  'custom': ''
};

export const AnnotationStatuses = {
  invalid: 'invalid' as 'invalid',
  wrong: 'wrong' as 'wrong',
  warning: 'warning' as 'warning',
  valid: 'valid' as 'valid',
};

export class Annotation {

  columnHeader: string;
  columnValuesType: string;

  // Relationship
  subject: string;
  property: string;
  propertyNamespace: string; // auto-filled based on the vocabularies
  propertyPrefix: string; // auto-filled based on the vocabularies

  // URI
  columnTypes: string[];
  columnTypesNamespace: string[]; // auto-filled based on the vocabularies
  columnTypesPrefix: string[]; // auto-filled based on the vocabularies
  urifyNamespace: string;
  urifyPrefix: string; // auto-filled based on the vocabularies

  // Literal
  columnDatatype: string;
  columnDatatypePrefix: string; // auto-filled based on the vocabularies
  columnDatatypeNamespace: string; // auto-filled based on the vocabularies
  langTag: string;

  // Helper
  isSubject: boolean;
  status: string;

  constructor(obj?: any) {
    this.subject = obj && obj.subject || '';
    this.property = obj && obj.property || '';
    this.propertyPrefix = obj && obj.propertyPrefix || '';
    this.propertyNamespace = obj && obj.propertyNamespace || '';
    this.columnTypes = obj && obj.columnTypes || [];
    this.columnTypesPrefix = obj && obj.columnTypesPrefix || [];
    this.columnTypesNamespace = obj && obj.columnTypesNamespace || [];
    this.columnHeader = obj && obj.columnHeader || '';
    this.columnValuesType = obj && obj.columnValuesType || '';
    this.urifyPrefix = obj && obj.urifyPrefix || '';
    this.urifyNamespace = obj && obj.urifyNamespace || '';
    this.columnDatatype = obj && obj.columnDatatype || '';
    this.columnDatatypeNamespace = obj && obj.columnDatatypeNamespace || '';
    this.columnDatatypePrefix = obj && obj.columnDatatypePrefix || '';
    this.langTag = obj && obj.langTag || '';
    this.isSubject = obj && obj.isSubject || '';
    this.status = obj && obj.status || '';
  }
}
