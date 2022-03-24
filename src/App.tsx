import { useEffect, useState, Key, useRef } from 'react';
import { Alert, Layout, Menu, Tooltip, notification, Input, Skeleton, Tree, Row, Col, List } from 'antd';
import { Catalog, RegistryApi, Manifest } from './ApiTypes';
import { CloseCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined, CodeOutlined } from '@ant-design/icons';

import ImageLayers from './components/ImageLayers';

interface DataNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: DataNode[];
  selectable: boolean;
}

function updateTreeData(list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] {
  return list.map(node => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });
}

const { Header, Content, Footer } = Layout;
const { ErrorBoundary } = Alert;
const { Search } = Input;

const settingsKey = "registryApi";

const unknownTooltipIcon = (<QuestionCircleOutlined style={{ color: 'gold' }} />);
const compatibleVersionTooltipIcon = (<CheckCircleOutlined style={{ color: 'green' }} />);
const incompatibleVersionTooltipIcon = (<CloseCircleOutlined style={{ color: 'red' }} />);

export default function App() {
  const [backend, setBackend] = useState<string>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);
  const [tooltipTitle, setTooltipTitle] = useState<string>("Unknown registry version");
  const [tooltipIcon, setTooltipIcon] = useState(unknownTooltipIcon);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedManifest, setSelectedManifest] = useState<Manifest>();
  const apiRef = useRef<RegistryApi>();

  const onLoadData = async ({ key, children }: any) => {
    const api = apiRef.current;

    if (api === undefined) {
      return;
    }

    if (children) {
      return;
    }

    if (key.indexOf(":") >= 0) {
      return;
    }

    const tagList = await api.getTags(key);

    const tagListTreeData = tagList.tags.map(tag => { return { key: `${tagList.name}:${tag}`, title: `${tagList.name}:${tag}`, isLeaf: true, selectable: true } as DataNode })

    setTreeData(origin => updateTreeData(origin, key, tagListTreeData));
  };

  const onSelect = async (selectedNodes: Key[]) => {
    const api = apiRef.current;

    if (selectedNodes.length > 1) {
      throw new Error("Selected nodes cannot be more than 1");
    }

    if (selectedNodes.length === 0) {
      setSelectedManifest(undefined);
      return;
    }

    if (api === undefined) {
      return;
    }

    const key = selectedNodes[0] as string;
    const [repository, reference] = key.split(":", 2);
    api.getManifest(repository, reference).then(setSelectedManifest);
  };

  useEffect(() => {
    const existingValue = localStorage.getItem(settingsKey);
    if (existingValue === null) {
      return;
    }

    setBackend(existingValue);
  }, []);

  useEffect(() => {
    if (backend === undefined) {
      return;
    }

    if (backend.trim() === '') {
      localStorage.removeItem(settingsKey);
      return;
    }

    localStorage.setItem(settingsKey, backend);

    setIsLoading(true);

    const api = new RegistryApi(backend);

    apiRef.current = api;

    const fetchData = async () => {
      const version = await api.getVersion();

      switch (version) {
        case true:
          setTooltipTitle("Version compatible");
          setTooltipIcon(compatibleVersionTooltipIcon);
          break;
        case false:
          setTooltipTitle("Version incompatible");
          setTooltipIcon(incompatibleVersionTooltipIcon);
          break;
        default:
          break;
      }

      const catalog = await api.getCatalog();

      setTreeData(catalog.repositories.map(repository => { return { title: repository, key: repository, isLeaf: false, selectable: false } as DataNode }));

      setIsLoading(false);
    };

    fetchData().catch(setError);
  }, [backend]);

  if (error) {
    throw error;
  }

  return (
    <Layout>
      <Header>
        <Row justify='space-between' style={{ width: '100%' }}>
          <Col md={12} xs={24}>
            <h1 className="logo">
              Registry Browser
            </h1>
          </Col>
          <Col md={12} xs={24}>
            <Search
              className='registry-url'
              addonBefore={(<Tooltip title={tooltipTitle} className="registry-icon">{tooltipIcon}</Tooltip>)}
              placeholder="Registry API URL"
              defaultValue={backend}
              loading={isLoading}
              onSearch={setBackend}
              enterButton={<Tooltip title="Update Registry URL and fetch new data"><CodeOutlined style={{ marginTop: '0.5em' }} /></Tooltip>} />

          </Col>
        </Row>
      </Header>
      <Content>
        <ErrorBoundary >
          <Row>
            <Col md={4} sm={24} >
              <h2>Browse Repositories</h2>
              <Skeleton loading={isLoading}>
                <Tree loadData={onLoadData} onSelect={onSelect} treeData={treeData} />
              </Skeleton>
            </Col>
            <Col style={{visibility: selectedManifest === undefined ? 'hidden' : 'visible'}} md={20} sm={24} flex="auto">
              <h2>Manifest Details</h2>
              {selectedManifest && (<>
                <List>
                  <List.Item>
                    <List.Item.Meta
                      title="Tag"
                      description={`${selectedManifest.name}:${selectedManifest.tag}`}
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="Created"
                      description={selectedManifest.history[selectedManifest.history.length - 1].v1Compatibility.created}
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="Architecture"
                      description={selectedManifest.architecture}
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="Schema Version"
                      description={selectedManifest.schemaVersion}
                    />
                  </List.Item>
                  <List.Item>
                    <List.Item.Meta
                      title="Build History"
                      description={(<ImageLayers history={selectedManifest.history} fsLayers={selectedManifest.fsLayers} />)}
                    />
                  </List.Item>
                </List>
              </>)}
            </Col>
          </Row>
        </ErrorBoundary>
      </Content>
      <Footer>
        <div className='footerContent'>
          Made with ❤️ by <a href='https://github.com/phidevz'>@phidevz</a>.
        </div>
      </Footer>
    </Layout >
  );
}
