import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'graph-mapping',
  templateUrl: './graph-mapping.component.html',
  styleUrls: ['./graph-mapping.component.css']
})
export class GraphMappingComponent implements OnInit {

  @Input() graph;

  constructor() { }

  ngOnInit() {
  }

}
