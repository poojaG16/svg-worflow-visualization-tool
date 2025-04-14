export const graph = [
  {
    node: {
      id: 'node1',
      name: 'Data Ingestion',
      x: 100,
      y: 100
    },
    ports: [
      { id: 'in-n1', y: 0, x: -60, type: 'input' },
      { id: 'ot-n1', y: 0, x: 60, type: 'output' },
    ],
  },
  {
    node: {
      id: 'node2',
      name: 'Data Cleansing',
      x: 300,
      y: 100
    },
    ports: [
      { id: 'in-n2', x: -60, y: 0, type: 'input' },
      { id: 'ot-n2', y: 0, x: 60, type: 'output' },
    ],
  },
  {
    node: {
      id: 'node3',
      name: 'Transformation',
      x: 500,
      y: 100
    },
    ports: [
      { id: 'in-n3', x: -60, y: 0, type: 'input' },
      { id: 'ot-n3', x: 60, y: 0, type: 'output' },
    ],
  },
  {
    node: {
      id: 'node4',
      name: 'Data Storage',
      x: 700,
      y: 100
    },
    ports: [
      { id: 'in-n4', x: -60, y: 0, type: 'input' },
    ],
  },
  {
    connectors: [
      { fromNodeId: 'node1', fromPortId: 'ot-n1', toNodeId: 'node2', toPortId: 'in-n2' },
      { fromNodeId: 'node2', fromPortId: 'ot-n2', toNodeId: 'node3', toPortId: 'in-n3' },
      { fromNodeId: 'node3', fromPortId: 'in-n3', toNodeId: 'node4', toPortId: 'in-n4' },
    ]
  }
];


