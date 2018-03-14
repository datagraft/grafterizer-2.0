import { Directive, ComponentRef, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { PropertyNodeDialogComponent } from 'app/rdf-mapping/graph-mapping/property-node-dialog/property-node-dialog.component';

@Directive({
  selector: '[propertyNodeDialogAnchor]'
})
export class PropertyNodeDialogAnchorDirective {

  constructor(private viewContainer: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) { }

  createDialog(dialogComponent: { new(...args: any[]): PropertyNodeDialogComponent }): ComponentRef<PropertyNodeDialogComponent> {
    this.viewContainer.clear();

    let dialogComponentFactory = this.componentFactoryResolver.resolveComponentFactory(dialogComponent);
    let dialogComponentRef = this.viewContainer.createComponent(dialogComponentFactory);

    dialogComponentRef.instance.close.subscribe(() => {
      dialogComponentRef.destroy();
    });

    return dialogComponentRef;
  }

}
