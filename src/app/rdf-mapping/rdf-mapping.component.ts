import { Component, OnInit } from '@angular/core';
import { RouterUrlService } from '../tabular-transformation/component-communication.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'rdf-mapping',
  templateUrl: './rdf-mapping.component.html',
  styleUrls: ['./rdf-mapping.component.css']
})
export class RdfMappingComponent implements OnInit {

  constructor(private routerService: RouterUrlService, private route: ActivatedRoute, private router: Router) {
    route.url.subscribe(() => this.concatURL());
  }

  ngOnInit() { }

  concatURL() {
    this.route.snapshot.url.pop();
    let str = '';
    for (let o in this.route.snapshot.url) {
      str = str.concat(this.route.snapshot.url[o].path);
      str = str.concat('/');
    }
    this.routerService.sendMessage(str);
  }

}
