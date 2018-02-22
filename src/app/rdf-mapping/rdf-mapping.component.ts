import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoutingService } from '../routing.service';
import { RdfVocabularyService } from './rdf-vocabulary.service';
import { TransformationService } from '../transformation.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'rdf-mapping',
  templateUrl: './rdf-mapping.component.html',
  styleUrls: ['./rdf-mapping.component.css'],
  providers: [RdfVocabularyService]
})

export class RdfMappingComponent implements OnInit, OnDestroy {
  private vocabSvcPath: string;
  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;

  private transformationSubscription: Subscription;
  private dataSubscription: Subscription;

  constructor(private routingService: RoutingService, private route: ActivatedRoute, private router: Router,
    private transformationSvc: TransformationService, vocabService: RdfVocabularyService) {
    route.url.subscribe(() => this.routingService.concatURL(route));
    // load the vocabularies from the transformation object
  }

  ngOnInit() {
    this.transformationSubscription =
      this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe((message) => {
      this.graftwerkData = message;
      console.log(this.transformationObj);
    });
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
//    this.transformationSvc.changeTransformationObj(this.transformationObj);
//    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }
}
