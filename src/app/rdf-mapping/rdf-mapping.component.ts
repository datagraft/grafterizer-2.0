import { Component, OnInit } from '@angular/core';
import { RouterUrlService } from '../tabular-transformation/component-communication.service';
import { RdfVocabularyService } from './rdf-vocabulary.service';
import { TransformationService } from '../transformation.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'rdf-mapping',
  templateUrl: './rdf-mapping.component.html',
  styleUrls: ['./rdf-mapping.component.css'],
  providers: [RdfVocabularyService]
})

export class RdfMappingComponent implements OnInit {
  private vocabSvcPath: string;
  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;
    
  constructor(private routerService: RouterUrlService, private route: ActivatedRoute, private router: Router, private transformationSvc: TransformationService, vocabService: RdfVocabularyService) {
    route.url.subscribe(() => this.concatURL());
  }

  ngOnInit() {
    this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.transformationSvc.currentGraftwerkData.subscribe(message => this.graftwerkData = message);
  }

  ngOnDestroy() {
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }

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
