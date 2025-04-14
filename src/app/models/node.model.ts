export interface Port {
    id: string;
    type: 'input' | 'output';
    x: number;
    y: number;
  }

export interface Node{
    name: string;
    id: string;
    x: number;
    y: number;
    radius?: number;
    ports: Port[];
}