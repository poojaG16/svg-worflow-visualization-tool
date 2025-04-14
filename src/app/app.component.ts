import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SvgCanvasComponent } from './features/workflow-canvas/svg-canvas/svg-canvas.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SvgCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'workflow-visualization-tool';
}
