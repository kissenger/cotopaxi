import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * See angular custom elements example: https://angular.io/guide/elements
 */

@Component({
  selector: 'app-alert-box',
  templateUrl: './alert-box.component.html',
  styleUrls: ['./alert-box.component.css']
})
export class AlertBoxComponent {
  // private state: 'opened' | 'closed' = 'closed';
  // public _message: string;
  // public _title: string;
  // public _okBtn: boolean;
  // public _cancelBtn: boolean;

  @Input()
  set message(message: string) { this.message = message; }
  get message(): string { return this.message; }

  @Input()
  set title(title: string) { this.title = title; }
  get title(): string { return this.title; }

  @Input()
  set okBtn(okBtn: boolean) { this.okBtn = okBtn; }
  get okBtn(): boolean { return this.okBtn; }

  @Input()
  set cancelBtn(cancelBtn: boolean) { this.cancelBtn = cancelBtn; }
  get cancelBtn(): boolean { return this.cancelBtn; }

  @Output()
  cancel = new EventEmitter();

  @Output()
  ok = new EventEmitter();

}
