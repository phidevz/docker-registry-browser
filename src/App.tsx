import { useEffect, useState, Key } from 'react';
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

const unknownTooltipIcon = (<QuestionCircleOutlined style={{ color: 'gold', marginTop: '0.4em' }} />);
const compatibleVersionTooltipIcon = (<CheckCircleOutlined style={{ color: 'green', marginTop: '0.4em' }} />);
const incompatibleVersionTooltipIcon = (<CloseCircleOutlined style={{ color: 'red', marginTop: '0.4em' }} />);

type OnDataLoadFn = ({ key, children }: any) => Promise<void>;
type OnSelectFn = (selectedNodes: Key[]) => Promise<void>;

export default function App() {
  const [backend, setBackend] = useState<string>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);
  const [isVersion2Api, setIsVersion2Api] = useState<boolean>();

  const getOnLoadData = (api: RegistryApi | undefined) => {
    if (api === undefined) {
      return async ({ }: any) => { };
    }

    return async ({ key, children }: any) => {
      if (children) {
        return;
      }

      if (key.indexOf(":") === -1) {
        const tagList = await api.getTags(key);

        const tagListTreeData = tagList.tags.map(tag => { return { key: `${tagList.name}:${tag}`, title: `${tagList.name}:${tag}`, isLeaf: true, selectable: true } as DataNode })

        setTreeData(origin => updateTreeData(origin, key, tagListTreeData));
      } else {

      }
    }
  };

  const getOnSelect = (api: RegistryApi | undefined) => {
    if (api === undefined) {
      return async (selectedNodes: Key[]) => { };
    }

    return async (selectedNodes: Key[]) => {
      if (selectedNodes.length > 1) {
        throw new Error("Selected nodes cannot be more than 1");
      }

      if (selectedNodes.length === 0) {
        setSiderSpan(0);
        return;
      }

      setSiderSpan(20);
      const key = selectedNodes[0] as string;
      const [repository, reference] = key.split(":", 2);
      api.getManifest(repository, reference).then(setSelectedManifest);
    }
  };

  const [onLoadData, setOnLoadData] = useState<OnDataLoadFn>(getOnLoadData(undefined));
  const [onSelect, setOnSelect] = useState<OnDataLoadFn>(getOnSelect(undefined));

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
      setIsVersion2Api(undefined);
      return;
    }

    localStorage.setItem(settingsKey, backend);

    setIsLoading(true);

    const api = new RegistryApi(backend);
    api.getVersion().then(setIsVersion2Api).catch(setError);
    api.getCatalog().then(setCatalog).catch(setError);

    setOnLoadData(getOnLoadData(api));
    setOnSelect(getOnSelect(api));
  }, [backend]);

  const [tooltipTitle, setTooltipTitle] = useState<string>("Unknown registry version");
  const [tooltipIcon, setTooltipIcon] = useState(unknownTooltipIcon);

  useEffect(() => {
    switch (isVersion2Api) {
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
  }, [isVersion2Api]);

  const [catalog, setCatalog] = useState<Catalog>();
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  const [siderSpan, setSiderSpan] = useState(0);
  const [selectedManifest, setSelectedManifest] = useState<Manifest>();

  useEffect(() => {
    if (catalog === undefined) {
      return;
    }

    setTreeData(catalog.repositories.map(repository => { return { title: repository, key: repository, isLeaf: false, selectable: false } as DataNode }));
  }, [catalog]);

  useEffect(() => console.log(selectedManifest), [selectedManifest]);

  if (error) {
    throw error;
  }

  useEffect(() => {
    switch (isVersion2Api) {
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

    setIsLoading(false);
  }, [isVersion2Api]);

  return (
    <Layout>
      <Header style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', flexWrap: 'wrap' }}>
        <h1 className="logo">
          Registry Browser
        </h1>
        <div>
          <Search
            style={{ verticalAlign: 'middle', minWidth: '30em' }}
            addonBefore={(<Tooltip title={tooltipTitle}>{tooltipIcon}</Tooltip>)}
            placeholder="Registry API URL"
            defaultValue={backend}
            loading={isLoading}
            onSearch={setBackend}
            enterButton={<Tooltip title="Update Registry URL and fetch new data"><CodeOutlined style={{ marginTop: '0.5em' }} /></Tooltip>} />
        </div>
      </Header>
      <Content>
        <ErrorBoundary >
          <Row>
            <Col span={24 - siderSpan}>
              <h2>Browse Repositories</h2>
              <Skeleton loading={catalog === undefined}>
                <Tree loadData={onLoadData} onSelect={onSelect} treeData={treeData} />
              </Skeleton>
            </Col>
            <Col span={siderSpan}>
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
        <div style={{ color: 'gray', borderTop: '1px solid gray', textAlign: 'center', paddingTop: '1em' }}>
          Made with ❤️ by <a href='https://github.com/phidevz'>@phidevz</a>.
        </div>
      </Footer>
    </Layout >
  );
}
