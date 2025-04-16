import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent {
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() visible: boolean = false;
  @Input() options: {label: string, icon:string, action: ()=> void }[] = [];
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(){
    console.log('ContextMenuComponent initialized with options:', this.options, 'and position:', this.position , 'visible:', this.visible);
  }

  onOptionClick(action: () => void) {
    action();
    this.onClose.emit(); // Close the context menu after an action is performed
  }
}
