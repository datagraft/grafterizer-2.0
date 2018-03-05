import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'blank-node',
  templateUrl: './blank-node.component.html',
  styleUrls: ['../graph-mapping-node-components.scss']
})
export class BlankNodeComponent implements OnInit {
  @Input() node: any;
  @Input() parent: any;
  private showActions = false;

  constructor() { }

  ngOnInit() {
    console.log(this.node);
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

}
