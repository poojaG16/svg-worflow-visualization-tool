import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, Port } from '../../../models/node.model';
import { Connector } from '../../../models/connector.model';
import { graph } from '../../../../assets/graph';

@Component({
  selector: 'app-svg-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-canvas.component.html',
  styleUrl: './svg-canvas.component.scss'
})
export class SvgCanvasComponent implements OnInit{

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<SVGSVGElement>;

  testnodes: any = [
    {
      name: 'Node 1',
      id: 'node-1',
      x: 100,
      y: 100,
      ports: [
        { id: 'out-1', type: 'output', x: 40, y: 0 }, // right center
      ]
    },
    {
      name: 'Node 2',
      id: 'node-2',
      x: 400,
      y: 100,
      ports: [
        { id: 'in-2', type: 'input', x: -40, y: 0 }, // left center
      ]
    }
  ];

  testConnector = [{
    id: 'conn-1',
    fromNodeId: 'node-1',
    fromPortId: 'out-1',
    toNodeId: 'node-2',
    toPortId: 'in-2',
  }];
  nodes = signal<Node[]>([]);
  connectors = signal<Connector[]>([]);

  draggingFrom: { nodeId: string; port: Port } | null = null;

  //zoom and pann
  zoom = signal(1);
  pan = signal({ x: 0, y: 0 });


  //private variables
  private draggingNode: Node | null = null;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  offsetX: number = 0;
  offsetY: number = 0;

  ngOnInit(): void {
    const graphData:any = graph;
    const flatNodes = graphData.filter((e:any)=> e.node).map(
      (e : any)=>({
        ...e.node,
        ports: e.ports || []
      })
    )

    const flattenConnectors = graphData.find((e:any) => e.connectors)?.connectors || [];

    this.nodes.set(flatNodes);
    this.connectors.set(flattenConnectors);
  }

  //add node 
  addNode() {
    const id = 'Node-' + Math.random().toString(36).substr(2, 9);
    const newNode: Node = {
      id: id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      radius: 40,
      name: 'Node ' + (this.nodes().length + 1),
      ports: [
        { id: 'in1', x: -40, y: 0, type: 'input' },
        { id: 'out1', x: 40, y: 0, type: 'output' }
      ]
    }

    this.nodes.update(nodes => [...nodes, newNode]);
    console.log(this.nodes());
  }


  startDrag(event: MouseEvent, node: Node) {
    this.draggingNode = node;
    this.offsetX = event.clientX - node.x;
    this.offsetY = event.clientY - node.y;
  }

  onDrag(event: MouseEvent) {
    if (this.draggingNode) {
      const svg = this.canvas.nativeElement as SVGSVGElement;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;

      // Transform the mouse coordinates to the SVG coordinate system
      const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

      const updated = this.nodes().map((node: Node) =>
        node.id === this.draggingNode!.id
          ? { ...node, x: svgPoint.x - this.offsetX, y: svgPoint.y - this.offsetY }
          : node
      );

      this.nodes.set(updated);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isPanning) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      this.pan.update(pan => ({ x: pan.x + dx, y: pan.y + dy }));
      this.panStart = { x: event.clientX, y: event.clientY };
    } else if (this.draggingNode) {
      this.onDrag(event);
    }
  }

  //Drag or pann functionality
  onMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      this.isPanning = true;
      this.panStart = { x: event.clientX, y: event.clientY };
    }

  }

  //stop panning
  onMouseUp(event: MouseEvent) {
    this.isPanning = false;
    this.stopDrag();
  }

  stopDrag() {
    this.draggingNode = null;
  }

  //Zoom functionality
  onWheel(event: WheelEvent) {
    event.preventDefault();
    //get deltaY
    const deltaY = event.deltaY < 0 ? 0.1 : -0.1;
    let newZoom = this.zoom() + deltaY;
    newZoom = Math.min(Math.max(newZoom, 0.3), 3);
    this.zoom.set(newZoom);

  }

  handlePortClick(data: { nodeId: string; port: Port }) {
    const { nodeId, port } = data;

    if (port.type === 'output') {
      this.draggingFrom = { nodeId, port };
    } else if (port.type === 'input' && this.draggingFrom) {
      const toNodeId = nodeId;
      const toPort = port;
      const from = this.draggingFrom;

      //create new connector
      const newConnector: Connector = {
        id: `conn-${Date.now()}`,
        fromNodeId: from.nodeId,
        fromPortId: from.port.id,
        toNodeId: toNodeId,
        toPortId: toPort.id,
      };
    } else {
      this.draggingFrom = null;
    }
  }

  getPortAbsolutePosition(nodeId: string, portId: string) {
    const node = this.nodes().find(n => n.id === nodeId);
    const port = node?.ports.find(p => p.id === portId);
    if (!node || !port) return { x: 0, y: 0 };

    // Account for panning and zooming
    const pan = this.pan();
    const zoom = this.zoom();

    return {
      x: (node.x + port.x) * zoom + pan.x,
      y: (node.y + port.y) * zoom + pan.y,
    };
  }

  getPorts(node: Node, nodeType: string) {
    const port = node.ports.filter(port => port.type === nodeType)
    return port ? port : [];
  }

  generateConnectorPath(conn: Connector): string {
    const fromPos = this.getPortAbsolutePosition(conn.fromNodeId, conn.fromPortId);
    const toPos = this.getPortAbsolutePosition(conn.toNodeId, conn.toPortId);

    // Reverse transform pan and zoom to get SVG-space points
    const zoom = this.zoom();
    const pan = this.pan();

    const x1 = (fromPos.x - pan.x) / zoom;
    const y1 = (fromPos.y - pan.y) / zoom;
    const x2 = (toPos.x - pan.x) / zoom;
    const y2 = (toPos.y - pan.y) / zoom;

    return `M${x1},${y1} L${x2},${y2}`;
  }

  getBezierPath(connector: Connector): string {
    const source = this.getPortPosition(connector.fromNodeId, connector.fromPortId);
    const target = this.getPortPosition(connector.toNodeId, connector.toPortId);

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const curvature = 0.5;

    const hx1 = source.x + curvature * dx;
    const hy1 = source.y;
    const hx2 = target.x - curvature * dx;
    const hy2 = target.y;

    return `M ${source.x},${source.y} C ${hx1},${hy1} ${hx2},${hy2} ${target.x},${target.y}`;
  }

  //to sync path coordinates while zoom and pan
  getSvgCoords(evt: MouseEvent): { x: number; y: number } {
    const svg = this.canvas.nativeElement as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    const screenCTM = svg.getScreenCTM();
    const transformed = screenCTM ? pt.matrixTransform(screenCTM.inverse()) : { x: 0, y: 0 };
    return { x: transformed.x, y: transformed.y };
  }

  getPortPosition(nodeId: string, portId: string): { x: number; y: number } {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const port = node.ports?.find(p => p.id === portId);
    if (!port) return { x: node.x, y: node.y };

    return {
      x: node.x + port.x,
      y: node.y + port.y
    };
  }
}
