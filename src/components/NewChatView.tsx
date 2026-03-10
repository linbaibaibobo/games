import { APP_CONFIG } from '../config';

interface NewChatViewProps {
  agents: any[];
  models: any[];
  selectedModel: string;
  newChatAgentId: string;
  newChatCwd: string;
  newChatPermissionMode: string;
  onSelectModel: (modelId: string) => void;
  onSelectAgent: (agentId: string) => void;
  onSetCwd: (cwd: string) => void;
  onSetPermissionMode: (mode: string) => void;
}

export function NewChatView({
}: NewChatViewProps) {

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-lg">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg mx-auto"
            style={{ 
              background: 'linear-gradient(135deg, var(--td-brand-color), var(--td-brand-color-hover))'
            }}
          >
            <span className="text-3xl font-bold text-white">{APP_CONFIG.nameInitial}</span>
          </div>
          <h2 
            className="text-2xl font-semibold mb-2"
            style={{ color: 'var(--td-text-color-primary)' }}
          >
            {APP_CONFIG.name}
          </h2>
          <p style={{ color: 'var(--td-text-color-secondary)' }}>
            我是您的智能客服助手，可以帮您处理退款、订单查询、技术支持等问题
          </p>
        </div>
        
        {/* 快速入口 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--td-text-color-primary)' }}>
            快速入口
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md"
              style={{
                borderColor: 'transparent',
                backgroundColor: 'var(--td-bg-color-component)',
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--td-text-color-primary)' }}>
                💰 退款/退货
              </div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
                申请退款、查询进度
              </div>
            </div>
            <div
              className="p-4 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md"
              style={{
                borderColor: 'transparent',
                backgroundColor: 'var(--td-bg-color-component)',
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--td-text-color-primary)' }}>
                📦 订单查询
              </div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
                订单状态、物流信息
              </div>
            </div>
            <div
              className="p-4 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md"
              style={{
                borderColor: 'transparent',
                backgroundColor: 'var(--td-bg-color-component)',
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--td-text-color-primary)' }}>
                🔧 技术支持
              </div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
                登录问题、APP使用
              </div>
            </div>
            <div
              className="p-4 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md"
              style={{
                borderColor: 'transparent',
                backgroundColor: 'var(--td-bg-color-component)',
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--td-text-color-primary)' }}>
                👨‍💼 转人工
              </div>
              <div className="text-xs" style={{ color: 'var(--td-text-color-secondary)' }}>
                联系人工客服
              </div>
            </div>
          </div>
        </div>

        {/* 提示文字 */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--td-bg-color-component)' }}
        >
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--td-text-color-primary)' }}>
            💡 使用提示
          </div>
          <ul className="text-xs space-y-1" style={{ color: 'var(--td-text-color-secondary)' }}>
            <li>• 直接输入您的问题，我会自动识别您的意图</li>
            <li>• 支持多轮对话，我会记住上下文</li>
            <li>• 输入"人工"可转接人工客服</li>
            <li>• 对话结束后请评价服务质量</li>
          </ul>
        </div>

        {/* 提示文字 */}
        <p className="text-center text-xs" style={{ color: 'var(--td-text-color-placeholder)' }}>
          工作时间：9:00-22:00 | 非工作时间可留言
        </p>
      </div>
    </div>
  );
}
