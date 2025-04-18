import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, Port } from '../../../models/node.model';
import { Connector } from '../../../models/connector.model';
import { graph } from '../../../../assets/graph';
import { ContextMenuComponent } from '../../../core/components/context-menu/context-menu.component';

@Component({
  selector: 'app-svg-canvas',
  standalone: true,
  imports: [CommonModule, ContextMenuComponent],
  templateUrl: './svg-canvas.component.html',
  styleUrl: './svg-canvas.component.scss'
})
export class SvgCanvasComponent implements OnInit {

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<SVGSVGElement>;

  //viewport to track the canvas
  viewport = { x: 0, y: 0, width: 1000, height: 1000 };

  initialNodes: Node[] = [];
  initialConnectors: Connector[] = [];

  // testnodes: any = [
  //   { id: '1', name: 'Start' },
  //   { id: '2', name: 'Extract', inputs: ['1'] },
  //   { id: '3', name: 'Transform', inputs: ['2'] },
  //   { id: '4', name: 'Load', inputs: ['3'] },
  //   { id: '5', name: 'End', inputs: ['4'] }
  // ];

  testnodes: any = [
    { id: '1', name: 'Root', inputs: [] },
    { id: '2', name: 'Child 1', inputs: ['1'] },
    { id: '3', name: 'Child 2', inputs: ['1'] },
    { id: '4', name: 'Child 3', inputs: ['1'] },
    { id: '5', name: 'Grandchild 1.1', inputs: ['2'] },
    { id: '6', name: 'Grandchild 1.2', inputs: ['2'] },
    { id: '7', name: 'Grandchild 2.1', inputs: ['3'] },
    { id: '8', name: 'Grandchild 2.2', inputs: ['3'] },
    { id: '9', name: 'Grandchild 3.1', inputs: ['4'] },
    { id: '10', name: 'Grandchild 3.2', inputs: ['4'] },
    { id: '11', name: 'Great-Grandchild 1.1.1', inputs: ['5'] },
    { id: '12', name: 'Great-Grandchild 1.1.2', inputs: ['5'] },
    { id: '13', name: 'Great-Grandchild 2.1.1', inputs: ['7'] },
    { id: '14', name: 'Great-Grandchild 2.1.2', inputs: ['7'] },
    { id: '15', name: 'Great-Grandchild 3.2.1', inputs: ['10'] },
    { id: '16', name: 'Great-Grandchild 3.2.2', inputs: ['10'] },
    { id: '17', name: 'Leaf 1', inputs: ['11'] },
    { id: '18', name: 'Leaf 2', inputs: ['12'] },
    { id: '19', name: 'Leaf 3', inputs: ['13'] },
    { id: '20', name: 'Leaf 4', inputs: ['14'] },
    { id: '21', name: 'Leaf 5', inputs: ['15'] },
    { id: '22', name: 'Leaf 6', inputs: ['16'] }
  ];

  nodes = signal<Node[]>([]);
  connectors = signal<Connector[]>([]);

  draggingFrom: { nodeId: string; port: Port } | null = null;
  tempConnector: { x: number; y: number } | null = null;
  selectedConnector: Connector | null = null;
  showMinimap: boolean = true;

  //zoom and pann
  zoom = signal(1);
  pan = signal({ x: 0, y: 0 });


  //private variables
  private draggingNode: Node | null = null;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };

  offsetX: number = 0;
  offsetY: number = 0;

  //conext menu properties
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedNode: Node | null = null;
  contextMenuOptions: { label: string; icon: string, action: () => void }[] = [];


  ngOnInit(): void {
    const graphData: any = graph;
    const flatNodes = graphData.filter((e: any) => e.node).map(
      (e: any) => ({
        ...e.node,
        ports: e.ports || []
      })
    )

    const flattenConnectors = graphData.find((e: any) => e.connectors)?.connectors || [];
    const objectGraph = this.generateGraphLayoutWithHierarchy(this.testnodes);
    this.nodes.set(objectGraph.node);
    this.connectors.set(objectGraph.connectors);

    // Store the initial state
    this.initialNodes = JSON.parse(JSON.stringify(objectGraph.node));
    this.initialConnectors = JSON.parse(JSON.stringify(objectGraph.connectors));

    // Initialize viewport
    this.updateViewport();

    //global keydown event listener
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    //context menu event listener
    window.addEventListener('click', this.closeContextMenu.bind(this));
  }

  //key event for delete and add node
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' && this.selectedConnector) {
      this.deleteSelectedConnector();
    }
  }

  selectConnector(connector: Connector) {
    this.selectedConnector = connector;
    console.log('Selected Connector:', connector);
  }

  deleteSelectedConnector() {
    if (this.selectedConnector) {
      this.connectors.update(connectors =>
        connectors.filter(conn => conn.id !== this.selectedConnector!.id)
      );
      this.selectedConnector = null; // Reset selected connector
      this.initialConnectors = JSON.parse(JSON.stringify(this.connectors()));
    }
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
    this.initialConnectors = JSON.parse(JSON.stringify(this.connectors()));
    this.initialNodes = JSON.parse(JSON.stringify(this.nodes()));
    console.log(this.nodes());
  }

  //context menu for node
  openContextMenu(event: MouseEvent, node: Node) {
    event.preventDefault();//prevent default browser context menu
    this.contextMenuVisible = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedNode = node;
    console.log('Selected Node:', node, this.contextMenuPosition, this.contextMenuVisible);

    // Define dynamic options for the context menu
    this.contextMenuOptions = [
      {
        label: 'Edit',
        action: () => this.editNode(node),
        icon: 'bi bi-pencil' // Font Awesome icon class
      },
      {
        label: 'Rename',
        action: () => this.renameNode(node),
        icon: 'bi bi-textarea-resize' // Font Awesome icon class
      },
      {
        label: 'Delete',
        action: () => this.deleteNode(node),
        icon: 'bi bi-trash' // Font Awesome icon class
      }
    ];
  }

  closeContextMenu() {
    this.contextMenuVisible = false;
    this.selectedNode = null;
  }

  editNode(node: Node) {
    console.log('Edit node:', node);
    // Add your edit logic here
  }

  renameNode(node: Node) {
    const newName = prompt('Enter new name for the node:', node.name);
    if (newName) {
      this.nodes.update(nodes =>
        nodes.map(n => n.id === node.id ? { ...n, name: newName } : n)
      );
      console.log('Node renamed:', node);
    }
  }

  deleteNode(node: Node) {
    this.nodes.update(nodes => nodes.filter(n => n.id !== node.id));
    //delete connectors also
    this.connectors.update(connectors =>
      connectors.filter(conn => conn.fromNodeId !== node.id && conn.toNodeId !== node.id)
    );
    this.initialConnectors = JSON.parse(JSON.stringify(this.connectors()));
    console.log('Node deleted:', node);
  }

  //create graph layout
  // generateGraphLayout(graphInput: any[]) {
  //   const nodeMap: Record<string, Node> = {};
  //   const spacingX = 250; // Horizontal spacing between nodes
  //   const yOffset = 100;  // Fixed vertical position for all nodes

  //   // Assign positions to nodes
  //   graphInput.forEach((n, index) => {
  //     const x = index * spacingX + 100; // Increment x-coordinate for each node
  //     const y = yOffset; // Keep y-coordinate constant

  //     nodeMap[n.id] = {
  //       id: n.id,
  //       name: n.name,
  //       x: x,
  //       y: y,
  //       ports: [
  //         { id: n.id + '_in', type: 'input', x: -40, y: 0 },
  //         { id: n.id + '_out', type: 'output', x: 40, y: 0 }
  //       ],
  //       radius: 40
  //     };
  //   });

  //   // Create connectors
  //   const connectors: Connector[] = [];
  //   graphInput.forEach(node => {
  //     if (node.inputs) {
  //       node.inputs.forEach((inputId: string) => {
  //         connectors.push({
  //           fromNodeId: inputId,
  //           fromPortId: nodeMap[inputId].ports.find(p => p.type === 'output')?.id || '',
  //           toNodeId: node.id,
  //           toPortId: nodeMap[node.id].ports.find(p => p.type === 'input')?.id || '',
  //           id: `conn-${inputId}-${node.id}`
  //         });
  //       });
  //     }
  //   });

  //   return {
  //     node: Object.values(nodeMap),
  //     connectors
  //   };
  // }

  generateGraphLayoutWithHierarchy(graphInput: any[]) {
    const nodeMap: Record<string, Node> = {};
    const spacingX = 200; // Horizontal spacing between levels
    const spacingY = 150; // Vertical spacing between nodes in the same level
    const rootX = 200; // Starting x-coordinate for the root node
    const rootY = 100; // Starting y-coordinate for the root node
  
    // Step 1: Build adjacency list and in-degree map
    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
  
    graphInput.forEach(node => {
      adjacencyList[node.id] = [];
      inDegree[node.id] = 0;
    });
  
    graphInput.forEach(node => {
      node.inputs.forEach((inputId: string) => {
        adjacencyList[inputId].push(node.id);
        inDegree[node.id]++;
      });
    });
  
    // Step 2: Perform topological sorting
    const sortedNodes: string[] = [];
    const queue: string[] = Object.keys(inDegree).filter(nodeId => inDegree[nodeId] === 0);
  
    while (queue.length > 0) {
      const current = queue.shift()!;
      sortedNodes.push(current);
  
      adjacencyList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
  
    // Step 3: Assign coordinates based on hierarchy
    const levelMap: Record<number, number> = {}; // Track the current y position for each x level
    const nodeLevel: Record<string, number> = {}; // Track the level of each node
    let currentX = rootX; // Track the current x-level for each hierarchy
  
    sortedNodes.forEach(nodeId => {
      const node = graphInput.find(n => n.id === nodeId);
      const parentIds = node.inputs;
  
      // Determine the level of the current node
      const level = parentIds.length === 0 ? 0 : Math.max(...parentIds.map((pid:any) => nodeLevel[pid])) + 1;
      nodeLevel[nodeId] = level;
  
      // If this is the first node in the level, initialize the x and y positions
      if (!levelMap[level]) {
        levelMap[level] = rootY;
        currentX = rootX + level * spacingX; // Increment x for each level
      }
  
      // Assign x and y coordinates
      const x = currentX;
      const y = levelMap[level]; // Get the current y position for this level
  
      // Update the y position for the next node in this level
      levelMap[level] += spacingY;
  
      // Assign coordinates to the node
      nodeMap[nodeId] = {
        id: node.id,
        name: node.name,
        x: x,
        y: y,
        ports: [
          { id: node.id + '_in', type: 'input', x: -40, y: 0 },
          { id: node.id + '_out', type: 'output', x: 40, y: 0 }
        ],
        radius: 40
      };
    });
  
    // Step 4: Create connectors
    const connectors: Connector[] = [];
    graphInput.forEach(node => {
      if (node.inputs) {
        node.inputs.forEach((inputId: string) => {
          connectors.push({
            fromNodeId: inputId,
            fromPortId: nodeMap[inputId].ports.find(p => p.type === 'output')?.id || '',
            toNodeId: node.id,
            toPortId: nodeMap[node.id].ports.find(p => p.type === 'input')?.id || '',
            id: `conn-${inputId}-${node.id}`
          });
        });
      }
    });
  
    return {
      node: Object.values(nodeMap),
      connectors
    };
  }
  resetGraph() {
    console.log(this.nodes());
    this.nodes.set(this.initialNodes);
    this.connectors.set(this.initialConnectors);
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

      this.updateViewport();
    } else if (this.draggingNode) {
      this.onDrag(event);
    } else if (this.draggingFrom) {
      // Update temporary connector position
      const svgCoords = this.getSvgCoords(event);
      this.tempConnector = { x: svgCoords.x, y: svgCoords.y };
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
    this.tempConnector = null; // Reset temporary connector
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

    this.updateViewport();

  }

  handlePortClick(data: { nodeId: string; port: Port }) {
    const { nodeId, port } = data;

    if (port.type === 'output') {
      this.draggingFrom = { nodeId, port };
    } else if (port.type === 'input' && this.draggingFrom) {
      // Complete the connection to the input port
      this.createConnector(this.draggingFrom, { nodeId, port });
      this.draggingFrom = null; // Reset dragging state
    }
  }

  createConnector(from: { nodeId: string; port: Port }, to: { nodeId: string; port: Port }) {
    const newConnector: Connector = {
      fromNodeId: from.nodeId,
      fromPortId: from.port.id,
      toNodeId: to.nodeId,
      toPortId: to.port.id,
      id: `conn-${from.nodeId}-${to.nodeId}`
    };

    // Update the connectors in the graph
    this.connectors.update(connectors => [...connectors, newConnector]);
    this.initialConnectors = JSON.parse(JSON.stringify(this.connectors()));
    this.initialNodes = JSON.parse(JSON.stringify(this.nodes()));
    console.log('Connector created:', newConnector);
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

  //update viewport
  updateViewport() {
    const zoom = this.zoom();
    const pan = this.pan();

    this.viewport = {
      x: - pan.x / zoom,
      y: - pan.y / zoom,
      width: 1000 / zoom,
      height: 1000 / zoom
    }
  }

  toggleMinimap() {
    this.showMinimap = !this.showMinimap;
  }


  //unsubscribe event listeners
  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('click', this.closeContextMenu.bind(this));

  }


}
