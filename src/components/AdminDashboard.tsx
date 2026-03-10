import { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Row, Col, Statistic, DatePicker, Button, MessagePlugin } from 'tdesign-react';
import { ChartIcon, ChatIcon, UserIcon, SmileIcon } from 'tdesign-icons-react';
import type { Session, SatisfactionRating } from '../types';

const { RangePicker } = DatePicker;

interface DashboardStats {
  totalSessions: number;
  todaySessions: number;
  satisfaction: {
    avgRating: number;
    totalCount: number;
    distribution: Record<number, number>;
  };
  intentStats: Array<{ intent: string; count: number }>;
  recentSessions: Session[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionMessages, setSessionMessages] = useState<any[]>([]);
  const [sessionSatisfaction, setSessionSatisfaction] = useState<SatisfactionRating | null>(null);

  // 获取仪表盘数据
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('获取数据失败');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      MessagePlugin.error('获取仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取会话详情
  const fetchSessionDetail = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('获取会话详情失败');
      const data = await response.json();
      setSelectedSession(data.session);
      setSessionMessages(data.messages);
      setSessionSatisfaction(data.satisfaction);
    } catch (error) {
      MessagePlugin.error('获取会话详情失败');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 意图名称映射
  const intentNameMap: Record<string, string> = {
    refund: '退款/退货',
    order: '订单查询',
    technical: '技术支持',
    human: '转人工',
    greeting: '问候',
    goodbye: '结束对话',
    general: '一般咨询',
    unknown: '未知'
  };

  // 会话表格列定义
  const sessionColumns = [
    {
      title: '会话标题',
      colKey: 'title',
      width: 200,
      cell: ({ row }: { row: Session }) => (
        <span className="font-medium">{row.title}</span>
      )
    },
    {
      title: '消息数',
      colKey: 'messageCount',
      width: 100,
      cell: ({ row }: { row: Session & { messageCount?: number } }) => (
        <Tag theme="primary" variant="light">
          {row.messageCount || 0} 条
        </Tag>
      )
    },
    {
      title: '满意度',
      colKey: 'satisfaction',
      width: 120,
      cell: ({ row }: { row: Session & { satisfaction?: SatisfactionRating } }) => (
        row.satisfaction ? (
          <div className="flex items-center gap-1">
            <span className="text-warning">{'★'.repeat(row.satisfaction.rating)}</span>
            <span className="text-gray-400">{'★'.repeat(5 - row.satisfaction.rating)}</span>
          </div>
        ) : (
          <Tag theme="default" variant="light">未评价</Tag>
        )
      )
    },
    {
      title: '创建时间',
      colKey: 'created_at',
      width: 180,
      cell: ({ row }: { row: Session }) => (
        new Date(row.created_at).toLocaleString('zh-CN')
      )
    },
    {
      title: '操作',
      colKey: 'action',
      width: 100,
      cell: ({ row }: { row: Session }) => (
        <Button
          theme="primary"
          variant="text"
          size="small"
          onClick={() => fetchSessionDetail(row.id)}
        >
          查看
        </Button>
      )
    }
  ];

  // 满意度分布颜色
  const satisfactionColors: Record<number, string> = {
    5: '#00a870',
    4: '#00a870',
    3: '#ed7b2f',
    2: '#e34d59',
    1: '#e34d59'
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--td-text-color-primary)' }}>
          客服管理后台
        </h1>
        <p className="text-sm" style={{ color: 'var(--td-text-color-secondary)' }}>
          查看对话记录、满意度统计和意图分析
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={3}>
          <Card loading={loading}>
            <Statistic
              title="总会话数"
              value={stats?.totalSessions || 0}
              prefix={<ChatIcon className="text-primary" />}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card loading={loading}>
            <Statistic
              title="今日会话"
              value={stats?.todaySessions || 0}
              prefix={<UserIcon className="text-success" />}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card loading={loading}>
            <Statistic
              title="平均满意度"
              value={stats?.satisfaction?.avgRating?.toFixed(1) || '0.0'}
              suffix="/ 5.0"
              prefix={<SmileIcon className="text-warning" />}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card loading={loading}>
            <Statistic
              title="评价数量"
              value={stats?.satisfaction?.totalCount || 0}
              prefix={<ChartIcon className="text-info" />}
            />
          </Card>
        </Col>
      </Row>

      {/* 满意度分布和意图统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card title="满意度分布" loading={loading}>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats?.satisfaction?.distribution?.[rating] || 0;
                const total = stats?.satisfaction?.totalCount || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="w-12 text-sm">{rating} 星</span>
                    <Progress
                      percentage={percentage}
                      color={satisfactionColors[rating]}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="用户意图分布" loading={loading}>
            <div className="space-y-2">
              {stats?.intentStats?.map((stat) => (
                <div
                  key={stat.intent}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ backgroundColor: 'var(--td-bg-color-container-hover)' }}
                >
                  <div className="flex items-center gap-2">
                    <Tag theme="primary" variant="light">
                      {intentNameMap[stat.intent] || stat.intent}
                    </Tag>
                  </div>
                  <span className="font-medium">{stat.count} 次</span>
                </div>
              ))}
              {!stats?.intentStats?.length && (
                <div className="text-center py-8 text-gray-400">暂无数据</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 会话列表 */}
      <Card title="最近会话记录" loading={loading}>
        <Table
          data={stats?.recentSessions || []}
          columns={sessionColumns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            total: stats?.recentSessions?.length || 0
          }}
          empty="暂无会话记录"
        />
      </Card>

      {/* 会话详情弹窗 */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[80vh] overflow-auto rounded-lg p-6"
            style={{ backgroundColor: 'var(--td-bg-color-container)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">会话详情</h2>
              <Button
                theme="default"
                shape="circle"
                onClick={() => setSelectedSession(null)}
              >
                ✕
              </Button>
            </div>

            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--td-bg-color-page)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">会话标题：</span>
                  <span>{selectedSession.title}</span>
                </div>
                <div>
                  <span className="text-gray-500">创建时间：</span>
                  <span>{new Date(selectedSession.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-gray-500">消息数量：</span>
                  <span>{sessionMessages.length} 条</span>
                </div>
                <div>
                  <span className="text-gray-500">满意度：</span>
                  {sessionSatisfaction ? (
                    <span className="text-warning">
                      {'★'.repeat(sessionSatisfaction.rating)}
                      {'☆'.repeat(5 - sessionSatisfaction.rating)}
                    </span>
                  ) : (
                    <span className="text-gray-400">未评价</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {sessionMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'ml-8 bg-primary/10'
                      : 'mr-8'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user'
                      ? 'var(--td-brand-color-light)'
                      : 'var(--td-bg-color-page)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Tag theme={msg.role === 'user' ? 'primary' : 'success'}>
                      {msg.role === 'user' ? '用户' : '客服'}
                    </Tag>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              ))}
            </div>

            {sessionSatisfaction?.feedback && (
              <div className="mt-4 p-3 rounded-lg border border-warning">
                <div className="text-sm font-medium mb-1">用户反馈：</div>
                <div className="text-sm">{sessionSatisfaction.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
