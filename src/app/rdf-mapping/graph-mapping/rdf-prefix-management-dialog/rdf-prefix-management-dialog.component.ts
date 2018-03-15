import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RdfVocabularyService } from 'app/rdf-mapping/rdf-vocabulary.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'app-rdf-prefix-management-dialog',
  templateUrl: './rdf-prefix-management-dialog.component.html',
  styleUrls: ['./rdf-prefix-management-dialog.component.css']
})
export class RdfPrefixManagementDialogComponent implements OnInit, OnDestroy {
  private openRdfPrefixManagementDialog = true;

  // Emits an event when we close the dialog so the component can be destroyed
  close = new EventEmitter();

  // Subscription to the RDF vocabulary service for the rdf vocabularies and the arrays that hold the default and transformation vocabs
  private rdfVocabsSubscription: Subscription;
  private defaultVocabs: Array<any>;
  private transformationVocabs: Array<any>;

  // Subscription to the transformation service for the data transformation
  private transformationSubscription: Subscription;
  private transformationObj: any;

  constructor(private rdfVocabSvc: RdfVocabularyService, private transformationSvc: TransformationService) { }

  ngOnInit() {
    this.rdfVocabsSubscription = this.rdfVocabSvc.allRdfVocabObservable.subscribe((rdfVocabsObj) => {
      this.defaultVocabs = rdfVocabsObj.defaultVocabs;
      this.transformationVocabs = rdfVocabsObj.transformationVocabs;
    });

    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  ngOnDestroy() {

  }

  onClickedExit() {
    this.openRdfPrefixManagementDialog = false;
    this.close.emit('closed dialog');
  }

  done() {
    this.onClickedExit();
  }
}
