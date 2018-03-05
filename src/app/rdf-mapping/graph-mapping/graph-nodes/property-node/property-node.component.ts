import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'property-node',
  templateUrl: './property-node.component.html',
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class PropertyNodeComponent implements OnInit {
  @Input() property;
  @Input() parent;
  private showActions = false;
  constructor() { }

  ngOnInit() {
  }

  editProperty() {
    console.log('PROPERTY Property');
  }

  addSiblingProperty() {
    console.log('ADD SIBLING Property');
  }

  removeProperty() {
    console.log('REMOVE Property');
  }

  showPropertyActions() {
    this.showActions = true;
  }

  hidePropertyActions() {
    this.showActions = false;
  }
}
