import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  message, 
  Upload, 
  Space, 
  Avatar, 
  notification, 
  Alert, 
  Typography, 
  Layout, 
  theme, 
  List, 
  Popconfirm 
} from 'antd';
import { 
  AudioOutlined, 
  UploadOutlined, 
  PlayCircleOutlined, 
  StopOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  HistoryOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import './App.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Header, Content } = Layout;

const App = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  const {
    token: { colorPrimary, colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Initialize speech recognition and synthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        message.error(`Voice input error: ${event.error}`);
        setIsListening(false);
      };
    }

    return () => {
      const recognition = recognitionRef.current;
      const synth = synthRef.current;

      if (recognition) recognition.stop();
      if (synth && synth.speaking) synth.cancel();
    };
  }, []);

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      message.warning('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('query', query);

      const response = await fetch('http://localhost:5000/query', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResponse(data.response);
      
      setConversationHistory(prev => [
        ...prev,
        {
          question: query,
          answer: data.response,
          timestamp: new Date().toLocaleString()
        }
      ]);
      
      speakResponse(data.response);
    } catch (error) {
      message.error('Error processing your query');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      message.error('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    message.info('Listening... Speak clearly in a quiet environment');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const speakResponse = (text) => {
    if (!synthRef.current) return;
    
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setQuery('');
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setQuery('');
    };
    
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setQuery('');
    }
  };

  const handleDocumentUpload = async (file) => {
    const isSupportedFormat = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ].includes(file.type);

    if (!isSupportedFormat) {
      message.error('Unsupported file format. Please upload PDF, DOC, DOCX, or TXT.');
      return false;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        api.success({
          message: 'Document Uploaded Successfully',
          description: `${file.name} has been processed.`,
          icon: <FileTextOutlined style={{ color: '#52c41a' }} />,
          placement: 'topRight',
          duration: 4.5,
        });
        setDocumentUploaded(true);
      } else {
        api.error({
          message: 'Upload Failed',
          description: data.error || 'Error processing document',
          placement: 'topRight',
          duration: 4.5,
        });
      }
    } catch (error) {
      api.error({
        message: 'Upload Error',
        description: 'Failed to upload document',
        placement: 'topRight',
        duration: 4.5,
      });
      console.error(error);
    }
    return false;
  };

  const handleDeleteDocument = async () => {
    try {
      const response = await fetch('http://localhost:5000/delete-document', {
        method: 'POST',
      });

      if (response.ok) {
        message.success('Document deleted successfully');
        setDocumentUploaded(false);
        setResponse('');
        setConversationHistory([]);
      } else {
        message.error('Failed to delete document');
      }
    } catch (error) {
      message.error('Error deleting document');
      console.error(error);
    }
  };

  return (
    <Layout className="app-layout">
      {contextHolder}
      <Header className="app-header" style={{ background: colorBgContainer }}>
        <div className="header-content">
          <Title level={3} style={{ margin: 0, color: colorPrimary }}>
            <Space>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: colorPrimary }} />
              Domain Specific Personal Assistant
            </Space>
          </Title>
          <Button 
            icon={<HistoryOutlined />} 
            onClick={() => setShowHistory(!showHistory)}
            style={{ marginLeft: 'auto' }}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
        </div>
      </Header>
      <Content className="app-content" style={{ padding: '0 48px' }}>
        <div className="main-container" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Card className="main-card" bordered={false}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {showHistory && conversationHistory.length > 0 && (
                <Card title="Conversation History" className="history-card">
                  <List
                    itemLayout="horizontal"
                    dataSource={[...conversationHistory].reverse()}
                    renderItem={(item, index) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`Q: ${item.question}`}
                          description={
                            <>
                              <Text>A: {item.answer}</Text>
                              <br />
                              <Text type="secondary">{item.timestamp}</Text>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {documentUploaded && (
                <Alert
                  message="Document is ready for querying"
                  type="success"
                  showIcon
                  closable
                  style={{ borderRadius: borderRadiusLG }}
                />
              )}

              <Card className="upload-card" hoverable>
                <Upload
                  beforeUpload={handleDocumentUpload}
                  showUploadList={false}
                  accept=".pdf,.doc,.docx,.txt"
                >
                  <Button 
                    icon={<UploadOutlined />}
                    type="dashed"
                    size="large"
                    block
                  >
                    {documentUploaded ? 'Upload Another Document' : 'Upload Document'}
                  </Button>
                </Upload>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Supported formats: PDF, DOC, DOCX, TXT
                </Text>
              </Card>

              <Card className="query-card" hoverable>
                <TextArea
                  rows={4}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your question here or use voice input..."
                  style={{ marginBottom: 16 }}
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  onPressEnter={handleQuerySubmit}
                />
                <div className="query-actions">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleQuerySubmit}
                    loading={loading}
                    disabled={!query.trim()}
                    style={{ minWidth: 120 }}
                  >
                    {loading ? 'Processing...' : 'Submit'}
                  </Button>
                  <Space>
                    <Button
                      icon={<AudioOutlined />}
                      size="large"
                      onClick={handleVoiceInput}
                      loading={isListening}
                      danger={isListening}
                    >
                      {isListening ? 'Listening...' : 'Voice Input'}
                    </Button>
                    {documentUploaded && (
                      <Popconfirm
                        title="Are you sure you want to delete the uploaded document?"
                        onConfirm={handleDeleteDocument}
                        okText="Yes"
                        cancelText="No"
                        placement="topRight"
                      >
                        <Button
                          icon={<DeleteOutlined />}
                          size="large"
                          danger
                        >
                          Delete
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              </Card>

              {response && (
                <Card 
                  className="response-card"
                  hoverable
                  title={<Text strong>Response</Text>}
                  extra={
                    <Space>
                      {isSpeaking ? (
                        <Button 
                          icon={<StopOutlined />} 
                          onClick={stopSpeaking}
                          size="middle"
                        >
                          Stop
                        </Button>
                      ) : (
                        <Button 
                          icon={<PlayCircleOutlined />} 
                          onClick={() => speakResponse(response)}
                          size="middle"
                        >
                          Speak Again
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <div className="response-content">
                    <div className="response-text">
                      <Text>{response}</Text>
                    </div>
                    <div className="avatar-container">
                      <Avatar 
                        size={80} 
                        icon={<AudioOutlined />} 
                        className={`speaking-avatar ${isSpeaking ? 'pulse' : ''}`}
                        style={{ backgroundColor: colorPrimary }}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </Space>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default App;