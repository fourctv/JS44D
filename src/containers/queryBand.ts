import { Directive, Component, EventEmitter, ElementRef, ContentChild, Input} from '@angular/core';

@Directive({
  selector: 'queryband'
})
export class QueryBandDirective { 
    /**
     * Get access to the embedded custom query band
     */
    @ContentChild('customQueryBand') theCustomQuery:any;

}
@Directive({
  selector: 'custombuttonbar'
})
export class CustomButtonBarDirective { }


@Component({
  selector: 'query-band',
  moduleId: module.id,
  templateUrl: 'queryBand.html',
  styleUrls: ['queryBand.css']
})

export class QueryBand   {
		
    /**
     * enable QBE button, default is true
     **/
    @Input() public enableQBE:boolean=true;
    
    /**
     * enable QFF (query from file) button, default is false
     **/
    @Input() public enableQFF:boolean=false;
    
    /**
     * enable Save/Load Searches/Set buttons, default is true
     **/
    @Input() public enableSETS:boolean=true;
    
    /**
     * enable Combine Searches buttons, default is true
     **/
    @Input() public enableCombiSearch:boolean=true;
    
    /**
     * enable Multicolumn Sort button, default is false
     **/
    @Input() public enableSort:boolean=false;
    
    /**
     * enable Export To Excel button, default is true
     **/
    @Input() public enableExportGrid:boolean=true;

    /**
     * Enable Record Edit Button bar, default is false
     */
    @Input() public enableButtonBar:boolean=false;
    
     /**
      * Enable Add record button, default is false
      */
    @Input() public enableAddRecord:boolean=false;
    
     /**
      * Enable Edit record button, default is true
      */
    @Input() public enableEditRecord:boolean=true;
    
     /**
      * Enable Delete record button, default is false
      */
    @Input() public enableDeleteRecord:boolean=false;
    
     /**
      * Cascade Delete record if Delete is enabled, default is false
      */
    @Input() public cascadeDeleteRecord:boolean=false;
  
    //
    // Events emitted by the QueryBand
    //
    queryFromQBE: EventEmitter<any> = new EventEmitter();
    queryFromFile: EventEmitter<any> = new EventEmitter();
    queryRefresh: EventEmitter<any> = new EventEmitter();
    querySortGrid: EventEmitter<any> = new EventEmitter();
    queryExportGrid: EventEmitter<any> = new EventEmitter();
   
    queryManageSets: EventEmitter<any> = new EventEmitter();
    
    //
    // Events emitted by the QueryBand's Button Bar
    //
    queryAddRecord: EventEmitter<any> = new EventEmitter();
    queryEditRecord: EventEmitter<any> = new EventEmitter();
    queryDeleteRecord: EventEmitter<any> = new EventEmitter();

    //
    // Internal variables
    //
    public openStateIcon:string = 'glyphicon-triangle-right';
    
    public queryBandIsOpen:boolean = false;
  
    /**
     * Get access to the embedded custom query band
     */
    @ContentChild(QueryBandDirective) theQueryBand:any;
 
    constructor(private elementRef:ElementRef) {
    }
    
    
    public switchState() {
        this.queryBandIsOpen = !this.queryBandIsOpen;
        this.openStateIcon = (this.queryBandIsOpen)?'glyphicon-triangle-bottom':'glyphicon-triangle-right';
    }
    
    public enableButton(btn:string):string {
        switch (btn) {
            case 'QBE':
                return (this.enableQBE)?'':'hidden';
          
           case 'QFF':
                return (this.enableQFF)?'':'hidden';
        
           case 'Sets':
                return (this.enableSETS)?'':'hidden';
        
           case 'Sort':
                return (this.enableSort)?'':'hidden';
        
            case 'Export':
                return (this.enableExportGrid)?'':'hidden';
        
            case 'ADD':
                return (this.enableButtonBar && this.enableAddRecord)?'':'hidden';
        
            case 'EDIT':
                return (this.enableButtonBar && this.enableEditRecord)?'':'hidden';
        
            case 'DEL':
                return (this.enableButtonBar && this.enableDeleteRecord)?'':'hidden';
         }
         
         return '';
    }
    
    public doQBE() {
        this.queryFromQBE.emit();
    }
    
    public doQFF() {
        this.queryFromFile.emit(null);
    }
    
    public doManageSets(action) {
         this.queryManageSets.emit(action);
    }
    
    public doRefresh() {
        if (this.theQueryBand.theCustomQuery) this.queryRefresh.emit(this.theQueryBand.theCustomQuery.currentQuery);
    }
    
    public doSort() {
        this.querySortGrid.emit(null);
    }
   
    public doClear() {
        let theForm:any = $(this.elementRef.nativeElement.getElementsByTagName('form'));
        if (theForm && theForm.length > 0) theForm[0].reset();
    }
   
    public doExportGrid() {
        this.queryExportGrid.emit(null);
    }
  
    public doAddRecord() {
        this.queryAddRecord.emit(null);
    }
  
    public doEditRecord() {
        this.queryEditRecord.emit(null);
    }
  
    public doDeleteRecord() {
        this.queryDeleteRecord.emit(null);
    }

    public doWehaveAQuery():boolean {
        return (this.theQueryBand.theCustomQuery.currentQuery && this.theQueryBand.theCustomQuery.currentQuery !== '');
    }
}
