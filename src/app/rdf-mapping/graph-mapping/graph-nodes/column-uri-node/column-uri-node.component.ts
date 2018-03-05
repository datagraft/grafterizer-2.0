import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'column-uri-node',
  templateUrl: './column-uri-node.component.html',
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class ColumnUriNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  constructor() {

  }

  editNode() {
    console.log('Edit Node' + this.node);
  }

  addSiblingNode() {
    console.log('ADD SIBLING NODE');
  }

  removeNode() {
    console.log('REMOVE NODE');
  }

  showNodeActions() {
    this.showActions = true;
  }

  hideNodeActions() {
    this.showActions = false;
  }

  ngOnInit() {
    console.log(this.node);
  }

}
