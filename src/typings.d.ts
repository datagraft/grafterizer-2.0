/* SystemJS module definition */
declare var module: NodeModule;
declare module "*.json" {
  const value: any;
  export default value;
}
interface NodeModule {
  id: string;
}
// declare module 'datalib';
